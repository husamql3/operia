import { Module } from '@nestjs/common';
import { NotionController } from './controllers';
import { NotionService } from './services';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class IntegrationsModule {}
