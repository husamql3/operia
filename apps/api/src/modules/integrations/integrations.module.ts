import { Module } from '@nestjs/common';
import { NotionController, GitHubController } from './controllers';
import { NotionService, GitHubService } from './services';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [NotionController, GitHubController],
  providers: [NotionService, GitHubService],
  exports: [NotionService, GitHubService],
})
export class IntegrationsModule {}
