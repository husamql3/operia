import { Controller, Get, Post, Query, UseGuards, Logger, Res, Body } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { NotionService } from '../services/notion.service';
import { AIService, TasksService } from '@/common/services';
import { Public, CurrentUser, JwtAuthGuard } from '@/common';
import { env } from '@/env';
import { TaskSource, DEFAULT_SKILLS, ProposalType } from '@/common/types/ai.types';
import {
  NotionInitiateOAuthDecorator,
  NotionCallbackDecorator,
  NotionStatusDecorator,
  NotionDisconnectDecorator,
  NotionGetPagesDecorator,
  NotionSyncDecorator,
} from '../decorators';

@ApiTags('integrations')
@Controller('integrations/notion')
export class NotionController {
  private readonly logger = new Logger(NotionController.name);

  constructor(
    private readonly notionService: NotionService,
    private readonly aiService: AIService,
    private readonly tasksService: TasksService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth')
  @NotionInitiateOAuthDecorator()
  initiateAuth(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Initiating Notion OAuth for user: ${userId}`);
    return this.notionService.initiateOAuthFlow(userId);
  }

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

      const pages = await this.notionService.fetchAndStorePagesForIntegration(integration);

      this.logger.log(`[CALLBACK] Redirecting to client with success=true`);

      const pagesQuery = encodeURIComponent(JSON.stringify(pages));
      return void res.redirect(`${env.CLIENT_URL}?notion_success=true&pages=${pagesQuery}`);
    } catch (err) {
      this.logger.error(`[CALLBACK] Error in callback handler:`, err);
      const errorParam = encodeURIComponent('Failed to process authorization');
      return void res.redirect(`${env.CLIENT_URL}?notion_error=${errorParam}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  @NotionStatusDecorator()
  async getIntegrationStatus(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Getting Notion integration status for user: ${userId}`);
    return this.notionService.getIntegrationStatusFlow(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('disconnect')
  @NotionDisconnectDecorator()
  async disconnect(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Disconnecting Notion integration for user: ${userId}`);
    return this.notionService.disconnectIntegration(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pages')
  @NotionGetPagesDecorator()
  async getPages(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Getting Notion pages for user: ${userId}`);
    const integration = await this.notionService.getIntegration(userId);

    if (!integration) {
      return {
        code: 404,
        success: false,
        message: 'No Notion integration found',
        data: {
          pages: {},
        },
        timestamp: new Date().toISOString(),
      };
    }

    const pages = await this.notionService.getPagesForIntegration(integration.id);
    return {
      code: 200,
      success: true,
      message: 'Pages retrieved successfully',
      data: {
        pages,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('extract')
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Extract tasks and proposals from content',
  //   description:
  //     'Analyzes provided content using AI to extract actionable tasks, proposals, and insights. Supports meeting transcripts, emails, messages, and other text content.',
  // })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       content: {
  //         description: 'The content to analyze (string, JSON object, array, or any other data)',
  //         example: {
  //           type: 'meeting_notes',
  //           data: 'Team Meeting - Sprint Planning\nAlice: We need to finish authentication by Friday.\nBob: I can take the backend work.',
  //         },
  //       },
  //       sourceName: {
  //         type: 'string',
  //         description: 'Name/title of the content source',
  //         example: 'Sprint Planning Meeting',
  //       },
  //       sourceType: {
  //         type: 'string',
  //         enum: Object.values(TaskSource),
  //         description: 'Type of source content',
  //         example: TaskSource.MEETING_TRANSCRIPT,
  //       },
  //     },
  //     required: ['content'],
  //   },
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Content extracted successfully',
  //   schema: {
  //     example: {
  //       code: 200,
  //       success: true,
  //       message: 'Content extracted successfully',
  //       data: {
  //         proposalBatchId: '550e8400-e29b-41d4-a716-446655440000',
  //         proposalsCount: 2,
  //         proposals: [
  //           {
  //             id: '1',
  //             type: 'create_task',
  //             title: 'Finish authentication by Friday',
  //             description: 'Complete the authentication feature implementation',
  //             evidence: ['Alice: We need to finish authentication by Friday'],
  //             rationale: 'Critical feature for the sprint',
  //             whatWillHappen: 'saved to task list',
  //             owner: 'Bob',
  //             deadline: '2026-02-07',
  //             priority: 'high',
  //           },
  //         ],
  //       },
  //       timestamp: '2026-02-05T10:30:00.000Z',
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request - empty content or extraction failed',
  //   schema: {
  //     example: {
  //       code: 400,
  //       success: false,
  //       message: 'Content is required and cannot be empty',
  //       data: null,
  //       timestamp: '2026-02-05T10:30:00.000Z',
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Unauthorized - missing or invalid JWT token',
  // })
  // @ApiResponse({
  //   status: 500,
  //   description: 'Internal server error',
  //   schema: {
  //     example: {
  //       code: 500,
  //       success: false,
  //       message: 'Error extracting content',
  //       data: null,
  //       timestamp: '2026-02-05T10:30:00.000Z',
  //     },
  //   },
  // })
  // async extractContent(
  //   @CurrentUser('sub') userId: string,
  //   @Body()
  //   body: {
  //     content: any;
  //     sourceName?: string;
  //     sourceType?: TaskSource;
  //   },
  // ) {
  //   this.logger.debug(`Extracting content for user: ${userId}`);

  //   const { content, sourceName = 'Notion Content', sourceType = TaskSource.NOTION } = body;

  //   // Convert content to string if it's not already
  //   let contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

  //   if (!contentString || contentString.trim().length === 0) {
  //     return {
  //       code: 400,
  //       success: false,
  //       message: 'Content is required and cannot be empty',
  //       data: null,
  //       timestamp: new Date().toISOString(),
  //     };
  //   }

  //   try {
  //     const result = await this.aiService.extractFromContent(
  //       contentString,
  //       sourceType,
  //       sourceName,
  //       DEFAULT_SKILLS,
  //       '', // no memory context
  //       userId,
  //     );

  //     return {
  //       code: result.success ? 200 : 400,
  //       success: result.success,
  //       message: result.success
  //         ? 'Content extracted successfully'
  //         : result.error || 'Extraction failed',
  //       data: {
  //         proposalBatchId: result.proposalBatchId,
  //         proposalsCount: result.proposalsCount,
  //         proposals: result.proposals,
  //       },
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error extracting content:`, error);
  //     return {
  //       code: 500,
  //       success: false,
  //       message: 'Error extracting content',
  //       data: null,
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  @NotionSyncDecorator()
  async sync(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Starting Notion sync for user: ${userId}`);
    const syncResult = await this.notionService.syncAndExtractContent(userId);

    if (!syncResult.success || !syncResult.data?.pages) {
      return syncResult;
    }

    try {
      const pages = syncResult.data.pages;
      this.logger.log(`Processing ${pages.length} pages for extraction`);

      const allPagesContent = JSON.stringify(pages, null, 2);

      const result = await this.aiService.extractFromContent(
        allPagesContent,
        TaskSource.NOTION,
        'Notion All Pages Sync',
        DEFAULT_SKILLS,
        '',
      );

      if (result.success) {
        this.logger.log(
          `[SYNC] Successfully extracted ${result.proposalsCount} proposals from all pages`,
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
              sourceType: TaskSource.NOTION,
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
          message: 'Notion content synced and extracted successfully',
          data: {
            totalPages: pages.length,
            proposalsCount: result.proposalsCount,
            proposals: result.proposals,
            proposalBatchId: result.proposalBatchId,
            savedTasksCount,
          },
          timestamp: new Date().toISOString(),
        };
      } else {
        this.logger.warn(`[SYNC] Failed to extract content from pages`);
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
        message: 'Error extracting Notion content',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
