import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { db } from '@/db';
import { integrations, notionPages, type Integration, type NewNotionPage } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '@/env';
import { HttpStatus } from '@nestjs/common';
import { errorResponse, successResponse } from '@/utils';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { IntegrationStatusResponseDto } from '../dto';
import type { NotionTokenResponse, NotionSearchResponse, NotionPagesMap } from '../types';

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);
  private readonly encryptionKey = Buffer.from(env.JWT_ACCESS_SECRET.padEnd(32, '0').slice(0, 32));

  private encryptUserId(userId: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(userId, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}.${encrypted.toString('hex')}`;
  }

  private decryptUserId(encryptedData: string): string {
    try {
      const [ivHex, encryptedHex] = encryptedData.split('.');
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Failed to decrypt userId:', error);
      throw new BadRequestException('Invalid state parameter');
    }
  }

  initiateOAuthFlow(userId: string) {
    this.logger.log(`[INITIATE] Starting OAuth flow for userId: ${userId}`);

    const state = this.encryptUserId(userId);
    this.logger.log(`[INITIATE] Encrypted userId into state`);

    const params = new URLSearchParams({
      client_id: env.NOTION_CLIENT_ID,
      redirect_uri: env.NOTION_REDIRECT_URI,
      response_type: 'code',
      owner: 'user',
      state,
    });

    const authUrl = `${env.NOTION_API_BASE_URL}/oauth/authorize?${params.toString()}`;
    this.logger.log(`[INITIATE] Generated OAuth authorization URL`);

    return successResponse(
      { authUrl, state },
      'Notion OAuth authorization URL generated',
      HttpStatus.OK,
    );
  }

  async exchangeCodeForToken(code: string): Promise<NotionTokenResponse> {
    try {
      const response = await fetch(env.NOTION_API_BASE_URL + '/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`,
          ).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: env.NOTION_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.statusText}`);
      }

      const data = (await response.json()) as NotionTokenResponse;
      this.logger.log('Successfully exchanged code for Notion token');
      return data;
    } catch (error) {
      this.logger.error(`Failed to exchange code for token: ${error}`);
      throw new BadRequestException(
        errorResponse(
          'Failed to exchange authorization code',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  async handleCallbackAndSave(code: string, state: string): Promise<Integration> {
    this.logger.log(`[CALLBACK] Starting handleCallbackAndSave with code and state`);

    try {
      this.logger.log(`[CALLBACK] Step 1: Decrypting userId from state`);
      const userId = this.decryptUserId(state);
      this.logger.log(`[CALLBACK] Step 2: Successfully decrypted userId: ${userId}`);

      this.logger.log(`[CALLBACK] Step 3: Exchanging code for token`);
      const tokenData = await this.exchangeCodeForToken(code);
      this.logger.log(
        `[CALLBACK] Step 4: Successfully exchanged code, got token for workspace: ${tokenData.workspace_name}`,
      );

      this.logger.log(`[CALLBACK] Step 5: Saving integration to database`);
      const integration = await this.saveIntegration(
        userId,
        tokenData.access_token,
        tokenData.workspace_id,
        tokenData.workspace_name,
        tokenData.bot_id,
      );
      this.logger.log(
        `[CALLBACK] Step 6: Successfully saved integration with id: ${integration.id}`,
      );

      return integration;
    } catch (error) {
      this.logger.error(
        `[CALLBACK] Error at some step: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async saveIntegration(
    userId: string,
    accessToken: string,
    workspaceId: string,
    workspaceName: string,
    botId: string,
  ): Promise<Integration> {
    try {
      this.logger.log(`[SAVE] Attempting to save integration for userId: ${userId}`);
      this.logger.log(`[SAVE] Parameters: workspace=${workspaceName}, botId=${botId}`);

      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.type, 'notion')))
        .limit(1);

      this.logger.log(`[SAVE] Existing integration found: ${existing.length > 0 ? 'yes' : 'no'}`);

      if (existing.length > 0) {
        this.logger.log(`[SAVE] Updating existing integration with id: ${existing[0].id}`);
        const updateResult = await db
          .update(integrations)
          .set({
            accessToken,
            workspaceId,
            workspaceName,
            bot: { id: botId },
            updatedAt: new Date(),
          })
          .where(eq(integrations.id, existing[0].id))
          .returning();

        this.logger.log(`[SAVE] Update successful, returning updated integration`);
        return updateResult[0];
      } else {
        this.logger.log(`[SAVE] Creating new integration`);
        const insertResult = await db
          .insert(integrations)
          .values({
            userId,
            type: 'notion',
            accessToken,
            workspaceId,
            workspaceName,
            bot: { id: botId },
          })
          .returning();

        this.logger.log(
          `[SAVE] Insert successful, created integration with id: ${insertResult[0].id}`,
        );
        return insertResult[0];
      }
    } catch (error) {
      this.logger.error(
        `[SAVE] Failed to save integration: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(`[SAVE] Full error:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to save integration',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getIntegration(userId: string): Promise<Integration | null> {
    try {
      const result = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.type, 'notion')))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.logger.error(`Failed to get integration: ${error}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve integration',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getIntegrationStatusFlow(userId: string) {
    const integration = await this.getIntegration(userId);

    this.logger.debug(`Retrieved integration status for user: ${userId}`);

    const statusData: IntegrationStatusResponseDto = {
      connected: !!integration,
      workspace: integration?.workspaceName || null,
      integration: integration
        ? {
            id: integration.id,
            type: integration.type,
            workspaceName: integration.workspaceName,
          }
        : null,
    };

    return successResponse(statusData, 'Integration status retrieved', HttpStatus.OK);
  }

  async disconnectIntegration(userId: string) {
    try {
      await db
        .delete(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.type, 'notion')));

      this.logger.log(`Integration disconnected for user: ${userId}`);

      return successResponse(
        { success: true },
        'Integration disconnected successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Failed to disconnect integration: ${error}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to disconnect integration',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async fetchPagesFromNotion(accessToken: string): Promise<NotionPagesMap> {
    try {
      this.logger.log('[FETCH_PAGES] Starting to fetch pages from Notion API');

      const workspacePages = await fetch(`${env.NOTION_API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 100,
          filter: { property: 'object', value: 'page' },
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Notion API error: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data: NotionSearchResponse) => {
          this.logger.log(`[FETCH_PAGES] Got ${data.results.length} results from Notion`);

          const pagesMap: NotionPagesMap = {};
          data.results
            .filter((page) => page.parent.type === 'workspace')
            .forEach((page) => {
              pagesMap[page.id] = {
                id: page.id,
                title: page.properties.title?.title?.[0]?.plain_text || 'Untitled',
                url: page.url,
              };
            });

          this.logger.log(
            `[FETCH_PAGES] Filtered to ${Object.keys(pagesMap).length} workspace-level pages`,
          );
          return pagesMap;
        });

      return workspacePages;
    } catch (error) {
      this.logger.error(`[FETCH_PAGES] Failed to fetch pages from Notion: ${error}`);
      throw error;
    }
  }

  async savePagesToDatabase(
    integrationId: string,
    pagesMap: NotionPagesMap,
  ): Promise<NewNotionPage[]> {
    try {
      const pages = Object.values(pagesMap);
      this.logger.log(
        `[SAVE_PAGES] Saving ${pages.length} pages for integration: ${integrationId}`,
      );

      await db.delete(notionPages).where(eq(notionPages.integrationId, integrationId));

      if (pages.length === 0) {
        this.logger.log('[SAVE_PAGES] No pages to save');
        return [];
      }

      const newPages: NewNotionPage[] = pages.map((page) => ({
        id: page.id,
        notionPageId: page.id,
        integrationId,
        title: page.title,
        url: page.url,
      }));

      await db.insert(notionPages).values(newPages);

      this.logger.log(`[SAVE_PAGES] Successfully saved ${newPages.length} pages`);
      return newPages;
    } catch (error) {
      this.logger.error(`[SAVE_PAGES] Failed to save pages: ${error}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to save Notion pages',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async fetchAndStorePagesForIntegration(integration: Integration): Promise<NotionPagesMap> {
    try {
      this.logger.log(
        `[FETCH_AND_STORE] Starting fetch and store for integration: ${integration.id}`,
      );

      const pagesMap = await this.fetchPagesFromNotion(integration.accessToken);
      await this.savePagesToDatabase(integration.id, pagesMap);

      this.logger.log(`[FETCH_AND_STORE] Completed successfully`);
      return pagesMap;
    } catch (error) {
      this.logger.error(
        `[FETCH_AND_STORE] Error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {};
    }
  }

  async getPagesForIntegration(integrationId: string): Promise<NotionPagesMap> {
    try {
      const pages = (await db
        .select()
        .from(notionPages)

        .where(eq(notionPages.integrationId, integrationId))) as Array<{
        notionPageId: string;
        title: string;
        url: string;
      }>;

      const pagesMap: NotionPagesMap = Object.fromEntries(
        pages.map((page) => [
          page.notionPageId,
          {
            id: page.notionPageId,
            title: page.title,
            url: page.url,
          },
        ]),
      );

      return pagesMap;
    } catch (error) {
      this.logger.error(`Failed to get pages for integration: ${error}`);
      return {};
    }
  }
}
