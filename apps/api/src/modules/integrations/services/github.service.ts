import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { db } from '@/db';
import { integrations, type Integration } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '@/env';
import { HttpStatus } from '@nestjs/common';
import { errorResponse, successResponse } from '@/utils';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { IntegrationStatusResponseDto } from '../dto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import type { GitHubTokenResponse, GitHubUserResponse, GitHubInstallation } from '../types';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly encryptionKey = Buffer.from(env.JWT_ACCESS_SECRET.padEnd(32, '0').slice(0, 32));
  private readonly privateKeyPath = 'operia-app.2026-02-08.private-key.pem';

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

  private generateJWT(): string {
    try {
      const privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
      const payload = {
        iss: env.GITHUB_APP_ID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes expiration
      };

      const tokenResult = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
      const token: string = typeof tokenResult === 'string' ? tokenResult : '';
      this.logger.debug('Generated GitHub App JWT');
      return token;
    } catch (error) {
      this.logger.error('Failed to generate JWT:', error);
      throw new InternalServerErrorException('Failed to generate GitHub App JWT');
    }
  }

  async getInstallationAccessToken(installationId: string): Promise<string> {
    try {
      const jwt = this.generateJWT();

      const response = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'X-GitHub-Api-Version': '2022-11-28',
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`GitHub API error: ${error}`);
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const jsonData = (await response.json()) as unknown;
      const data = jsonData as { token: string };
      this.logger.log('Successfully obtained installation access token');
      return data.token;
    } catch (error) {
      this.logger.error(`Failed to get installation access token: ${error}`);
      throw new BadRequestException(
        errorResponse(
          'Failed to obtain GitHub installation token',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  initiateOAuthFlow(userId: string) {
    this.logger.log(`[INITIATE] Starting OAuth flow for userId: ${userId}`);

    const state = this.encryptUserId(userId);
    this.logger.log(`[INITIATE] Encrypted userId into state`);

    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_REDIRECT_URI,
      scope: 'user:email read:user repo read:repo_hook', // Minimal scopes for personal token
      state,
      allow_signup: 'true',
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    this.logger.log(`[INITIATE] Generated OAuth authorization URL`);

    return successResponse(
      { authUrl, state },
      'GitHub OAuth authorization URL generated',
      HttpStatus.OK,
    );
  }

  async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: env.GITHUB_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const jsonData = (await response.json()) as unknown;
      const data = jsonData as GitHubTokenResponse;

      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error}`);
      }

      this.logger.log('Successfully exchanged code for GitHub token');
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

  async getUserInfo(accessToken: string): Promise<GitHubUserResponse> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = (await response.json()) as GitHubUserResponse;
      this.logger.log(`Retrieved GitHub user info: ${data.login}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to get user info: ${error}`);
      throw new BadRequestException(
        errorResponse(
          'Failed to retrieve GitHub user information',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
  }

  async getAppInstallation(accessToken: string): Promise<GitHubInstallation[]> {
    try {
      const response = await fetch('https://api.github.com/user/installations', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = (await response.json()) as { installations: GitHubInstallation[] };
      this.logger.log(`Found ${data.installations.length} app installations`);
      return data.installations;
    } catch (error) {
      this.logger.error(`Failed to get app installations: ${error}`);
      throw new BadRequestException(
        errorResponse(
          'Failed to retrieve app installations',
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
      this.logger.log(`[CALLBACK] Step 4: Successfully exchanged code, got access token`);

      this.logger.log(`[CALLBACK] Step 5: Retrieving GitHub user information`);
      const userInfo = await this.getUserInfo(tokenData.access_token);
      this.logger.log(`[CALLBACK] Step 6: Retrieved user: ${userInfo.login}`);

      this.logger.log(`[CALLBACK] Step 7: Getting app installations`);
      let installationId: string | null = null;

      try {
        const installations = await this.getAppInstallation(tokenData.access_token);
        const operia_app = installations.find((inst) => inst.app_slug === 'operia-app');

        if (operia_app) {
          this.logger.log(`[CALLBACK] Step 8: Found Operia app installation: ${operia_app.id}`);
          installationId = operia_app.id.toString();
        } else {
          this.logger.warn(
            `[CALLBACK] Operia app installation not found - integration will work with user token only`,
          );
          installationId = null;
        }
      } catch (error) {
        this.logger.warn(
          `[CALLBACK] Could not retrieve app installations: ${error}. Proceeding with user token.`,
        );
        installationId = null;
      }

      this.logger.log(`[CALLBACK] Step 9: Saving integration to database`);
      const integration = await this.saveIntegration(
        userId,
        tokenData.access_token,
        userInfo.login,
        userInfo.id.toString(),
        installationId || 'none',
      );
      this.logger.log(
        `[CALLBACK] Step 10: Successfully saved integration with id: ${integration.id}`,
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
    username: string,
    githubUserId: string,
    installationId: string,
  ): Promise<Integration> {
    try {
      this.logger.log(`[SAVE] Attempting to save integration for userId: ${userId}`);
      this.logger.log(`[SAVE] Parameters: username=${username}, installationId=${installationId}`);

      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.userId, userId), eq(integrations.type, 'github')))
        .limit(1);

      this.logger.log(`[SAVE] Existing integration found: ${existing.length > 0 ? 'yes' : 'no'}`);

      if (existing.length > 0) {
        this.logger.log(`[SAVE] Updating existing integration with id: ${existing[0].id}`);
        const updateResult = await db
          .update(integrations)
          .set({
            accessToken,
            workspaceId: githubUserId,
            workspaceName: username,
            bot:
              installationId && installationId !== 'none'
                ? { id: installationId, type: 'github_app' }
                : { type: 'personal_token' },
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
            type: 'github',
            accessToken,
            workspaceId: githubUserId,
            workspaceName: username,
            bot:
              installationId && installationId !== 'none'
                ? { id: installationId, type: 'github_app' }
                : { type: 'personal_token' },
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
        .where(and(eq(integrations.userId, userId), eq(integrations.type, 'github')))
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
        .where(and(eq(integrations.userId, userId), eq(integrations.type, 'github')));

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

  async getIssues(userId: string) {
    try {
      this.logger.log(`[GET_ISSUES] Fetching issues for user: ${userId}`);

      const integration = await this.getIntegration(userId);
      if (!integration) {
        this.logger.warn(`[GET_ISSUES] No GitHub integration found for user: ${userId}`);
        return {
          code: 404,
          success: false,
          message: 'No GitHub integration found',
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      // Use installation token if available, otherwise use user token
      let accessToken = integration.accessToken;
      const botData = integration.bot;
      const installationId =
        typeof botData === 'object' && botData !== null && 'id' in botData
          ? (botData as { id: string }).id
          : null;

      if (installationId && installationId !== 'none') {
        try {
          accessToken = await this.getInstallationAccessToken(installationId);
          this.logger.log(`[GET_ISSUES] Using installation access token`);
        } catch (error) {
          this.logger.warn(
            `[GET_ISSUES] Could not get installation token, falling back to user token: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } else {
        this.logger.log(`[GET_ISSUES] Using user access token`);
      }

      const response = await fetch('https://api.github.com/issues?state=open&per_page=100', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const issuesData = (await response.json()) as unknown;
      const rawIssues = Array.isArray(issuesData) ? issuesData : [];

      // Filter and simplify issues to only those assigned to the current user
      const userLogin = (await this.getUserInfo(accessToken)).login;
      const simplifiedIssues = rawIssues
        .filter((issue) => {
          const issueObj = issue as Record<string, unknown>;
          const assignees = issueObj.assignees as Array<{ login: string }> | undefined;
          return assignees && assignees.some((a) => a.login === userLogin);
        })
        .map((issue) => {
          const issueObj = issue as Record<string, unknown>;
          const labels = (issueObj.labels as Array<{ name: string }> | undefined) || [];
          const repository = issueObj.repository as Record<string, unknown> | undefined;
          const assignees = (issueObj.assignees as Array<{ login: string }> | undefined) || [];

          return {
            number: issueObj.number as number,
            title: issueObj.title as string,
            body: (issueObj.body as string | null) || null,
            url: issueObj.html_url as string,
            repository: repository?.full_name ? (repository.full_name as string) : 'unknown',
            assignee: assignees[0]?.login || null,
            labels: labels.map((l) => l.name),
            createdAt: issueObj.created_at as string,
            updatedAt: issueObj.updated_at as string,
            comments: (issueObj.comments as number) || 0,
          };
        });

      this.logger.log(
        `[GET_ISSUES] Retrieved ${rawIssues.length} issues, filtered to ${simplifiedIssues.length} assigned to ${userLogin}`,
      );

      return {
        code: 200,
        success: true,
        message: 'Issues retrieved and filtered successfully',
        data: {
          issues: simplifiedIssues,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[GET_ISSUES] Error fetching issues: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        code: 500,
        success: false,
        message: 'Error fetching issues',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getRepositories(userId: string) {
    try {
      this.logger.log(`[GET_REPOS] Fetching repositories for user: ${userId}`);

      const integration = await this.getIntegration(userId);
      if (!integration) {
        this.logger.warn(`[GET_REPOS] No GitHub integration found for user: ${userId}`);
        return {
          code: 404,
          success: false,
          message: 'No GitHub integration found',
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      // Use installation token if available, otherwise use user token
      let accessToken = integration.accessToken;
      const botData = integration.bot;
      const installationId =
        typeof botData === 'object' && botData !== null && 'id' in botData
          ? (botData as { id: string }).id
          : null;

      if (installationId && installationId !== 'none') {
        try {
          accessToken = await this.getInstallationAccessToken(installationId);
          this.logger.log(`[GET_REPOS] Using installation access token`);
        } catch (error) {
          this.logger.warn(
            `[GET_REPOS] Could not get installation token, falling back to user token: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } else {
        this.logger.log(`[GET_REPOS] Using user access token`);
      }

      const response = await fetch('https://api.github.com/user/repos', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const reposData = (await response.json()) as unknown;
      const repos = Array.isArray(reposData) ? reposData : [];

      this.logger.log(`[GET_REPOS] Retrieved ${repos.length} repositories`);

      return {
        code: 200,
        success: true,
        message: 'Repositories retrieved successfully',
        data: {
          repositories: repos as Array<{
            id: number;
            name: string;
            full_name: string;
            html_url: string;
            description: string | null;
          }>,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[GET_REPOS] Error fetching repositories: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        code: 500,
        success: false,
        message: 'Error fetching repositories',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async syncAndExtractContent(userId: string) {
    try {
      this.logger.log(`[SYNC] Starting sync and extraction for user: ${userId}`);

      const integration = await this.getIntegration(userId);

      if (!integration) {
        this.logger.warn(`[SYNC] No integration found for user: ${userId}`);
        return {
          code: 404,
          success: false,
          message: 'No GitHub integration found',
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      // Use installation token if available, otherwise use user token
      let accessToken = integration.accessToken;
      const botData = integration.bot;
      const installationId =
        typeof botData === 'object' && botData !== null && 'id' in botData
          ? (botData as { id: string }).id
          : null;

      if (installationId && installationId !== 'none') {
        try {
          accessToken = await this.getInstallationAccessToken(installationId);
          this.logger.log(`[SYNC] Using installation access token`);
        } catch (error) {
          this.logger.warn(
            `[SYNC] Could not get installation token, falling back to user token: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } else {
        this.logger.log(`[SYNC] Using user access token`);
      }

      this.logger.log(`[SYNC] Fetching issues`);
      const issuesResponse = await fetch('https://api.github.com/issues?state=open&per_page=100', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!issuesResponse.ok) {
        throw new Error(`GitHub API error: ${issuesResponse.statusText}`);
      }

      const issuesData = (await issuesResponse.json()) as unknown;
      const rawIssues = Array.isArray(issuesData) ? issuesData : [];

      // Filter and simplify issues to only those assigned to the current user
      const userLogin = (await this.getUserInfo(accessToken)).login;
      const simplifiedIssues = rawIssues
        .filter((issue) => {
          const issueObj = issue as Record<string, unknown>;
          const assignees = issueObj.assignees as Array<{ login: string }> | undefined;
          return assignees && assignees.some((a) => a.login === userLogin);
        })
        .map((issue) => {
          const issueObj = issue as Record<string, unknown>;
          const labels = (issueObj.labels as Array<{ name: string }> | undefined) || [];
          const repository = issueObj.repository as Record<string, unknown> | undefined;
          const assignees = (issueObj.assignees as Array<{ login: string }> | undefined) || [];

          return {
            number: issueObj.number as number,
            title: issueObj.title as string,
            body: (issueObj.body as string | null) || null,
            url: issueObj.html_url as string,
            repository: repository?.full_name ? (repository.full_name as string) : 'unknown',
            assignee: assignees[0]?.login || null,
            labels: labels.map((l) => l.name),
            createdAt: issueObj.created_at as string,
            updatedAt: issueObj.updated_at as string,
            comments: (issueObj.comments as number) || 0,
          };
        });

      this.logger.log(
        `[SYNC] Found ${rawIssues.length} issues, filtered to ${simplifiedIssues.length} assigned to ${userLogin}`,
      );

      return {
        code: 200,
        success: true,
        message: 'GitHub content synced successfully',
        data: {
          totalIssues: simplifiedIssues.length,
          issues: simplifiedIssues,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[SYNC] Error during sync: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        code: 500,
        success: false,
        message: 'Error syncing GitHub content',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
