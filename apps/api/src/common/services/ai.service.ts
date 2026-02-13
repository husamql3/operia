import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AIConfigService } from './ai-config.service';
import {
  TaskSource,
  Proposal,
  ExtractionResult,
  LLMMessage,
  LLMResponse,
  AISkills,
  DEFAULT_SKILLS,
  DailySummary,
} from '@/common/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * System Prompts for the AI Agent
 */
const SYSTEM_PROMPT = `You are Operia, an AI Operations Copilot. Your role is to analyze various work signals (Notion pages, Slack messages, GitHub issues, meeting transcripts) to help users stay organized.

CRITICAL RULES:
1. You NEVER execute actions autonomously - you only PROPOSE actions
2. Every proposal must include evidence (direct quotes from the source)
3. Every proposal must explain WHY it was suggested
4. Every proposal must clearly state WHAT WILL HAPPEN if approved (always "saved to task list" - no automation)

You extract:
- Decisions made in meetings or discussions
- Action items and tasks
- Owners and deadlines (if mentioned)
- Follow-up requirements
- Potential risks or blockers

Be concise, accurate, and always cite your sources with exact quotes.`;

/**
 * Extraction Prompt Template
 */
const EXTRACTION_PROMPT_TEMPLATE = `Analyze the following content and generate action proposals.

SOURCE TYPE: {sourceType}
SOURCE: {sourceName}

ENABLED SKILLS:
{skillsList}

{memoryContext}

CONTENT TO ANALYZE:
---
{content}
---

Generate a JSON response with the following structure:
{
  "proposals": [
    {
      "id": "unique-id-1",
      "type": "create_task" | "draft_followup" | "reminder" | "summary" | "risk_alert",
      "title": "Brief title",
      "description": "Detailed description of the action",
      "evidence": ["Exact quote from content supporting this"],
      "rationale": "Why this action is being proposed",
      "whatWillHappen": "If approved, this will be saved to your task list for tracking",
      "owner": "Person responsible (if mentioned)",
      "deadline": "Deadline (if mentioned, in ISO format)",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Return ONLY valid JSON. Generate proposals only for items clearly mentioned or implied in the content.`;

/**
 * Summary Prompt Template
 */
const SUMMARY_PROMPT_TEMPLATE = `Generate a daily summary for {date}.

APPROVED ACTIONS TODAY:
{actionsText}

RECENT CONTEXT:
{contextText}

Generate a concise, professional summary that:
1. Highlights key accomplishments
2. Lists pending items
3. Notes any upcoming deadlines
4. Suggests focus areas for tomorrow

Return a JSON response:
{
  "summaryText": "The narrative summary in 2-3 paragraphs",
  "highlights": ["Key point 1", "Key point 2"],
  "pendingItems": ["Pending item 1", "Pending item 2"],
  "upcomingDeadlines": ["Deadline info 1"],
  "tomorrowFocus": ["Focus area 1"]
}

Return ONLY valid JSON.`;

/**
 * Builds a formatted list of enabled skills
 */
function buildSkillsList(skills: AISkills): string {
  const skillDescriptions = {
    extractTasks: '- Extract all actionable tasks with owners and deadlines if mentioned',
    summarize: '- Create a brief summary of key decisions and outcomes',
    draftFollowups: '- Draft follow-up messages for any items that need communication',
    suggestReminders: '- Suggest reminders for time-sensitive items',
    detectRisks: '- Identify any blockers, risks, or concerns mentioned',
  };

  return Object.entries(skillDescriptions)
    .filter(([key]) => skills[key as keyof AISkills])
    .map(([, desc]) => desc)
    .join('\n');
}

/**
 * AI Service
 *
 * Provides the core AI functionality for task extraction, summarization, and proposals.
 * Mirrors the Python agent.py implementation with proper TypeScript types.
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private axiosInstance: AxiosInstance;
  private config: ReturnType<AIConfigService['getAllSettings']>;

  constructor(private aiConfigService: AIConfigService) {
    this.aiConfigService.validateConfiguration();
    this.config = this.aiConfigService.getAllSettings();

    // Initialize axios instance for Azure OpenAI API
    this.axiosInstance = axios.create({
      timeout: 90000,
    });

    this.logger.log(
      `AI Service initialized with deployment: ${this.config.azureOpenAI.deployment}`,
    );
  }

  /**
   * Call Azure OpenAI API directly
   */
  private async callLLMDirect(
    messages: LLMMessage[],
    responseFormat?: { type: 'json_object' },
  ): Promise<string> {
    const settings = this.config.azureOpenAI;
    const url = `${settings.endpoint}/openai/deployments/${settings.deployment}/chat/completions?api-version=${settings.apiVersion}`;

    const headers = {
      'Content-Type': 'application/json',
      'api-key': settings.apiKey,
    };

    const payload = {
      messages,
      temperature: this.config.agent.temperature,
      max_tokens: this.config.agent.maxTokens,
      response_format: responseFormat,
    };

    try {
      const response = await this.axiosInstance.post<LLMResponse>(url, payload, { headers });

      if (
        response.data.choices &&
        response.data.choices.length > 0 &&
        response.data.choices[0].message
      ) {
        return response.data.choices[0].message.content;
      }

      throw new Error('Invalid response from Azure OpenAI API');
    } catch (error) {
      this.logger.error('Error calling Azure OpenAI API:', error);

      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as unknown;
        const errorMessage =
          (typeof errorData === 'object' && errorData !== null && 'error' in errorData
            ? (errorData as { error: { message?: string } }).error?.message
            : null) || error.message;
        throw new Error(`Azure OpenAI API Error: ${errorMessage}`);
      }

      throw error;
    }
  }

  /**
   * Extract tasks and proposals from content
   *
   * This is the main orchestration method that:
   * 1. Prepares the prompt with enabled skills
   * 2. Calls the LLM
   * 3. Parses the response
   * 4. Returns structured proposals
   */
  async extractFromContent(
    content: string,
    sourceType: TaskSource,
    sourceName: string = '',
    skills: AISkills = DEFAULT_SKILLS,
    memoryContext: string = '',
  ): Promise<ExtractionResult> {
    try {
      // Build the skills list for the prompt
      const skillsList = buildSkillsList(skills);

      // Format the extraction prompt
      const userPrompt = EXTRACTION_PROMPT_TEMPLATE.replace('{sourceType}', sourceType)
        .replace('{sourceName}', sourceName)
        .replace('{skillsList}', skillsList || '(No skills enabled)')
        .replace('{memoryContext}', memoryContext ? `CONTEXT:\n${memoryContext}` : '')
        .replace('{content}', content);

      // Prepare messages for LLM
      const messages: LLMMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];

      this.logger.debug(
        `Extracting proposals from ${sourceType} (${sourceName || 'unnamed source'})`,
      );

      // Call the LLM
      const response = await this.callLLMDirect(messages, { type: 'json_object' });

      // Parse the response
      let parsedData: unknown;

      try {
        parsedData = JSON.parse(response);
      } catch {
        this.logger.error('Failed to parse LLM response as JSON:', response);
        return {
          success: false,
          proposalsCount: 0,
          error: 'Failed to parse AI response. The response was not valid JSON.',
        };
      }

      const responseData = parsedData as { proposals: Proposal[] };

      // Validate and process proposals
      if (!responseData.proposals || !Array.isArray(responseData.proposals)) {
        return {
          success: false,
          proposalsCount: 0,
          error: 'Invalid response structure: missing or invalid proposals array',
        };
      }

      const batchId = uuidv4();
      this.logger.log(`Successfully extracted ${responseData.proposals.length} proposals`);

      return {
        success: true,
        proposalsCount: responseData.proposals.length,
        proposalBatchId: batchId,
        proposals: responseData.proposals,
      };
    } catch (error) {
      this.logger.error('Error during content extraction:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        proposalsCount: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate a daily summary
   *
   * Takes approved actions and context to generate a structured daily summary
   */
  async generateDailySummary(
    userId: string,
    date: string = new Date().toISOString().split('T')[0],
    actionsText: string = '',
    contextText: string = '',
  ): Promise<DailySummary | null> {
    try {
      // Format the summary prompt
      const userPrompt = SUMMARY_PROMPT_TEMPLATE.replace('{date}', date)
        .replace('{actionsText}', actionsText || '(No approved actions today)')
        .replace('{contextText}', contextText || '(No additional context)');

      // Prepare messages for LLM
      const messages: LLMMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ];

      this.logger.debug(`Generating daily summary for user ${userId} on ${date}`);

      // Call the LLM
      const response = await this.callLLMDirect(messages, { type: 'json_object' });

      // Parse the response
      let parsedResponse: unknown;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        this.logger.error('Failed to parse summary response as JSON:', response);
        return null;
      }
      const summaryData = parsedResponse as {
        summaryText: string;
        highlights: string[];
        pendingItems: string[];
        upcomingDeadlines: string[];
        tomorrowFocus: string[];
      };

      // Create the daily summary object
      const summary: DailySummary = {
        id: uuidv4(),
        userId,
        date,
        summaryText: summaryData.summaryText,
        highlights: summaryData.highlights || [],
        pendingItems: summaryData.pendingItems || [],
        upcomingDeadlines: summaryData.upcomingDeadlines || [],
        tomorrowFocus: summaryData.tomorrowFocus || [],
        createdAt: new Date(),
      };

      this.logger.log(`Successfully generated daily summary for ${date}`);

      return summary;
    } catch (error) {
      this.logger.error('Error generating daily summary:', error);
      return null;
    }
  }

  /**
   * Test the Azure OpenAI connection
   *
   * Useful for health checks and initialization
   */
  async testConnection(): Promise<boolean> {
    try {
      const messages: LLMMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "connection successful" in exactly those words.' },
      ];

      const response = await this.callLLMDirect(messages);

      this.logger.log('Azure OpenAI connection test successful');
      return response.toLowerCase().includes('connection successful');
    } catch (error) {
      this.logger.error('Azure OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current agent settings
   */
  getAgentSettings() {
    return this.config.agent;
  }

  /**
   * Get current Azure OpenAI settings (without sensitive data)
   */
  getSettings() {
    return {
      azureOpenAI: {
        endpoint: this.config.azureOpenAI.endpoint,
        deployment: this.config.azureOpenAI.deployment,
        apiVersion: this.config.azureOpenAI.apiVersion,
      },
      agent: this.config.agent,
      debugMode: this.config.debugMode,
    };
  }
}
