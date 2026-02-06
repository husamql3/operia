import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { UploadModule } from './modules/upload/upload.module';
import { AIModule } from './modules/ai/ai.module';

@Module({
  imports: [AuthModule, IntegrationsModule, UploadModule, AIModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
