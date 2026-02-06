import { Module } from '@nestjs/common';
import { NotionController } from './controllers';
import { NotionService } from './services';

@Module({
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class IntegrationsModule {}
