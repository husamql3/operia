import { Module } from '@nestjs/common';
import { AIConfigService, AIService, TasksService } from '@/common/services';

/**
 * AI Module
 *
 * Provides AI services for task extraction, summarization, and LLM interactions.
 * Exposes AIService and AIConfigService for use in other modules.
 */
@Module({
  controllers: [],
  providers: [AIConfigService, AIService, TasksService],
  exports: [AIConfigService, AIService, TasksService],
})
export class AIModule {}
