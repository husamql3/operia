import { Module } from '@nestjs/common';
import { AIConfigService, AIService } from '@/common/services';

/**
 * AI Module
 *
 * Provides AI services for task extraction, summarization, and LLM interactions.
 * Exposes AIService and AIConfigService for use in other modules.
 */
@Module({
  controllers: [],
  providers: [AIConfigService, AIService],
  exports: [AIConfigService, AIService],
})
export class AIModule {}
