import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [AuthModule, IntegrationsModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
