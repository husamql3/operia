import { Injectable, Logger } from '@nestjs/common';
import { env } from '@/env';

/**
 * Azure OpenAI Settings
 */
export interface AzureOpenAISettings {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

/**
 * Agent Settings
 */
export interface AgentSettings {
  name: string;
  memoryWindowDays: number;
  maxProposalsPerBatch: number;
  temperature: number;
  maxTokens: number;
}

/**
 * AI Configuration Service
 *
 * Provides centralized configuration management for the AI service,
 * similar to the Python config.py
 */
@Injectable()
export class AIConfigService {
  private readonly logger = new Logger(AIConfigService.name);

  /**
   * Get Azure OpenAI Settings
   */
  getAzureOpenAISettings(): AzureOpenAISettings {
    return {
      endpoint: env.AZURE_OPENAI_ENDPOINT,
      apiKey: env.AZURE_OPENAI_API_KEY,
      deployment: env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: env.AZURE_OPENAI_API_VERSION,
    };
  }

  /**
   * Get Agent Settings
   */
  getAgentSettings(): AgentSettings {
    return {
      name: env.AI_AGENT_NAME,
      memoryWindowDays: env.AI_MEMORY_WINDOW_DAYS,
      maxProposalsPerBatch: env.AI_MAX_PROPOSALS_PER_BATCH,
      temperature: env.AI_TEMPERATURE,
      maxTokens: env.AI_MAX_TOKENS,
    };
  }

  /**
   * Get all AI-related settings
   */
  getAllSettings() {
    return {
      azureOpenAI: this.getAzureOpenAISettings(),
      agent: this.getAgentSettings(),
      debugMode: env.AI_DEBUG_MODE,
      environment: env.NODE_ENV,
    };
  }

  /**
   * Validate AI configuration
   */
  validateConfiguration(): void {
    const settings = this.getAllSettings();

    if (!settings.azureOpenAI.endpoint) {
      throw new Error('AZURE_OPENAI_ENDPOINT is required');
    }

    if (!settings.azureOpenAI.apiKey) {
      throw new Error('AZURE_OPENAI_API_KEY is required');
    }

    if (!settings.azureOpenAI.deployment) {
      throw new Error('AZURE_OPENAI_DEPLOYMENT is required');
    }

    this.logger.debug('AI configuration validated successfully');
  }

  /**
   * Log configuration (without sensitive data)
   */
  logConfiguration(): void {
    const settings = this.getAllSettings();
    const safeSettings = {
      ...settings,
      azureOpenAI: {
        ...settings.azureOpenAI,
        apiKey: '***' + settings.azureOpenAI.apiKey.slice(-5),
      },
    };
    this.logger.log('AI Service Configuration:', JSON.stringify(safeSettings, null, 2));
  }
}
