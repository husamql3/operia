import { Controller, Get, Post, Query, UseGuards, Logger, Res, Body } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { NotionService } from '../services/notion.service';
import {
  InitiateOAuthResponseDto,
  IntegrationStatusResponseDto,
  DisconnectIntegrationResponseDto,
} from '../dto';
import { Public, CurrentUser, JwtAuthGuard } from '@/common';
import { env } from '@/env';
import {
  NotionInitiateOAuthDecorator,
  NotionCallbackDecorator,
  NotionStatusDecorator,
  NotionDisconnectDecorator,
} from '../decorators';

@ApiTags('integrations')
@Controller('integrations/notion')
export class NotionController {
  private readonly logger = new Logger(NotionController.name);

  constructor(private readonly notionService: NotionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  @NotionInitiateOAuthDecorator()
  initiateAuth(@CurrentUser('sub') userId: string): InitiateOAuthResponseDto {
    this.logger.debug(`Initiating Notion OAuth for user: ${userId}`);
    return this.notionService.initiateOAuthFlow(userId);
  }

  @Public()
  @Public()
  @Get('callback')
  @NotionCallbackDecorator()
  async handleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[CALLBACK] Received OAuth callback`);
    this.logger.log(`[CALLBACK] Has code: ${!!code}, Has state: ${!!state}, Has error: ${!!error}`);

    if (error) {
      this.logger.warn(`[CALLBACK] OAuth error from Notion: ${error}`);
      const errorParam = encodeURIComponent(error);
      return void res.redirect(`${env.CLIENT_URL}?notion_error=${errorParam}`);
    }

    if (!code || !state) {
      this.logger.warn(
        `[CALLBACK] Missing required parameters - code: ${!!code}, state: ${!!state}`,
      );
      return void res.redirect(`${env.CLIENT_URL}?notion_error=missing_params`);
    }

    try {
      this.logger.log(`[CALLBACK] Starting integration save process`);
      const integration = await this.notionService.handleCallbackAndSave(code, state);

      this.logger.log(`[CALLBACK] Integration saved successfully with id: ${integration.id}`);
      this.logger.log(`[CALLBACK] Redirecting to client with success=true`);
      return void res.redirect(`${env.CLIENT_URL}?notion_success=true`);
    } catch (err) {
      this.logger.error(`[CALLBACK] Error in callback handler:`, err);
      const errorParam = encodeURIComponent('Failed to process authorization');
      return void res.redirect(`${env.CLIENT_URL}?notion_error=${errorParam}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  @NotionStatusDecorator()
  async getIntegrationStatus(
    @CurrentUser('sub') userId: string,
  ): Promise<IntegrationStatusResponseDto> {
    this.logger.debug(`Getting Notion integration status for user: ${userId}`);
    return this.notionService.getIntegrationStatusFlow(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('disconnect')
  @NotionDisconnectDecorator()
  async disconnect(@CurrentUser('sub') userId: string): Promise<DisconnectIntegrationResponseDto> {
    this.logger.debug(`Disconnecting Notion integration for user: ${userId}`);
    return this.notionService.disconnectIntegration(userId);
  }
}
