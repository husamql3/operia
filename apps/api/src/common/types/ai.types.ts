/**
 * AI Models and Types
 *
 * Defines all data models used by the AI service, mirroring the Python pydantic models.
 */

/**
 * Task Source Enum - Where a task originated from
 */
export enum TaskSource {
  MANUAL = 'manual',
  MEETING_TRANSCRIPT = 'meeting_transcript',
  EMAIL = 'email',
  SLACK = 'slack',
  GITHUB = 'github',
  NOTION = 'notion',
}

/**
 * Task Priority Enum
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Task Status Enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

/**
 * Proposal Type Enum - Type of action being proposed
 */
export enum ProposalType {
  CREATE_TASK = 'create_task',
  DRAFT_FOLLOWUP = 'draft_followup',
  REMINDER = 'reminder',
  SUMMARY = 'summary',
  RISK_ALERT = 'risk_alert',
}

/**
 * Proposal Status Enum
 */
export enum ProposalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DRAFT = 'draft',
}

/**
 * Individual Proposal/Action Proposal
 * Represents a single proposed action extracted by the AI
 */
export interface Proposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  evidence: string[];
  rationale: string;
  whatWillHappen: string;
  owner?: string;
  deadline?: string;
  priority: TaskPriority;
  status?: ProposalStatus;
}

/**
 * Proposal Batch
 * A collection of proposals from a single content extraction
 */
export interface ProposalBatch {
  id: string;
  userId: string;
  sourceType: TaskSource;
  sourceName?: string;
  proposals: Proposal[];
  createdAt: Date;
  status: ProposalStatus;
}

/**
 * Task Model
 * Represents an actionable task
 */
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  sourceName?: string;
  owner?: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extraction Result
 * Result of content extraction by the AI agent
 */
export interface ExtractionResult {
  success: boolean;
  proposalsCount: number;
  proposalBatchId?: string;
  error?: string;
  proposals?: Proposal[];
}

/**
 * LLM Message
 * Represents a message in the LLM conversation
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM Response
 * Response from Azure OpenAI API
 */
export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Approved Action
 * An action that has been approved by the user
 */
export interface ApprovedAction {
  id: string;
  userId: string;
  proposalId: string;
  batchId: string;
  actionType: ProposalType;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Memory Item
 * Contextual information stored for the agent's memory
 */
export interface MemoryItem {
  id: string;
  userId: string;
  content: string;
  itemType: string;
  activeDay?: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Daily Summary
 * A summary of the day's activities and tasks
 */
export interface DailySummary {
  id: string;
  userId: string;
  date: string;
  summaryText: string;
  highlights: string[];
  pendingItems: string[];
  upcomingDeadlines: string[];
  tomorrowFocus: string[];
  createdAt: Date;
}

/**
 * AI Skills Configuration
 * Defines which skills are enabled for the agent
 */
export interface AISkills {
  extractTasks: boolean;
  summarize: boolean;
  draftFollowups: boolean;
  suggestReminders: boolean;
  detectRisks: boolean;
}

/**
 * Default skills configuration
 */
export const DEFAULT_SKILLS: AISkills = {
  extractTasks: true,
  summarize: true,
  draftFollowups: true,
  suggestReminders: true,
  detectRisks: true,
};
