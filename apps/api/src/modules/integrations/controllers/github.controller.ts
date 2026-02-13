import { Controller, Get, Post, Query, UseGuards, Logger, Res, Body } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { GitHubService } from '../services/github.service';
import { AIService, TasksService } from '@/common/services';
import { Public, CurrentUser, JwtAuthGuard } from '@/common';
import { env } from '@/env';
import { TaskSource, DEFAULT_SKILLS, ProposalType } from '@/common/types/ai.types';
import {
  GitHubInitiateOAuthDecorator,
  GitHubCallbackDecorator,
  GitHubStatusDecorator,
  GitHubDisconnectDecorator,
  GitHubGetRepositoriesDecorator,
  GitHubSyncDecorator,
} from '../decorators';

@ApiTags('integrations')
@Controller('integrations/github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly aiService: AIService,
    private readonly tasksService: TasksService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  @GitHubInitiateOAuthDecorator()
  initiateAuth(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Initiating GitHub OAuth for user: ${userId}`);
    return this.githubService.initiateOAuthFlow(userId);
  }

  @Public()
  @Get('callback')
  @GitHubCallbackDecorator()
  async handleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`[CALLBACK] Received OAuth callback`);
    this.logger.log(`[CALLBACK] Has code: ${!!code}, Has state: ${!!state}, Has error: ${!!error}`);

    if (error) {
      this.logger.warn(`[CALLBACK] OAuth error from GitHub: ${error}`);
      const errorParam = encodeURIComponent(error);
      return void res.redirect(`${env.CLIENT_URL}?github_error=${errorParam}`);
    }

    if (!code || !state) {
      this.logger.warn(
        `[CALLBACK] Missing required parameters - code: ${!!code}, state: ${!!state}`,
      );
      return void res.redirect(`${env.CLIENT_URL}?github_error=missing_params`);
    }

    try {
      this.logger.log(`[CALLBACK] Starting integration save process`);
      const integration = await this.githubService.handleCallbackAndSave(code, state);

      this.logger.log(`[CALLBACK] Integration saved successfully with id: ${integration.id}`);

      return void res.redirect(`${env.CLIENT_URL}?github_success=true`);
    } catch (err) {
      this.logger.error(`[CALLBACK] Error in callback handler:`, err);
      const errorParam = encodeURIComponent('Failed to process authorization');
      return void res.redirect(`${env.CLIENT_URL}?github_error=${errorParam}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  @GitHubStatusDecorator()
  async getIntegrationStatus(@CurrentUser('sub') userId: string): Promise<unknown> {
    this.logger.debug(`Getting GitHub integration status for user: ${userId}`);
    return this.githubService.getIntegrationStatusFlow(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('disconnect')
  @GitHubDisconnectDecorator()
  async disconnect(@CurrentUser('sub') userId: string): Promise<unknown> {
    this.logger.debug(`Disconnecting GitHub integration for user: ${userId}`);
    return this.githubService.disconnectIntegration(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('issues')
  @GitHubGetRepositoriesDecorator()
  async getIssues(@CurrentUser('sub') userId: string): Promise<unknown> {
    this.logger.debug(`Getting GitHub issues for user: ${userId}`);
    return await this.githubService.getIssues(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  @GitHubSyncDecorator()
  async sync(@CurrentUser('sub') userId: string): Promise<unknown> {
    this.logger.debug(`Starting GitHub sync for user: ${userId}`);
    const syncResult = await this.githubService.syncAndExtractContent(userId);

    if (!syncResult.success || !syncResult.data?.issues) {
      return syncResult;
    }

    try {
      const issues = syncResult.data.issues;

      const allIssuesContent = JSON.stringify(issues, null, 2);

      const result = await this.aiService.extractFromContent(
        allIssuesContent,
        TaskSource.GITHUB,
        'GitHub All Issues Sync',
        DEFAULT_SKILLS,
        '',
      );

      if (result.success) {
        this.logger.log(
          `[SYNC] Successfully extracted ${result.proposalsCount} proposals from all issues`,
        );

        // Filter and save only create_task proposals
        const createTaskProposals =
          result.proposals?.filter((p) => p.type === ProposalType.CREATE_TASK) || [];
        let savedTasksCount = 0;

        if (createTaskProposals.length > 0) {
          try {
            const taskInputs = createTaskProposals.map((proposal) => ({
              userId,
              title: proposal.title,
              description: proposal.description,
              sourceType: TaskSource.GITHUB,
              tags: proposal.evidence || [],
              priority: proposal.priority,
              endDate: proposal.deadline ? new Date(proposal.deadline) : undefined,
            }));

            await this.tasksService.createManyTasks(taskInputs);
            savedTasksCount = taskInputs.length;
            this.logger.log(`[SYNC] Saved ${savedTasksCount} tasks from proposals`);
          } catch (taskError) {
            this.logger.error(`[SYNC] Failed to save tasks: ${taskError}`);
          }
        }

        return {
          code: 200,
          success: true,
          message: 'GitHub content synced and extracted successfully',
          data: {
            totalIssues: issues.length,
            proposalsCount: result.proposalsCount,
            proposals: result.proposals,
            proposalBatchId: result.proposalBatchId,
            savedTasksCount,
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        this.logger.warn(`[SYNC] Failed to extract content from issues`);
        return {
          code: 400,
          success: false,
          message: result.error || 'Extraction failed',
          data: null,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.error(`[SYNC] Error during extraction: ${error}`);
      return {
        code: 500,
        success: false,
        message: 'Error extracting GitHub content',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
