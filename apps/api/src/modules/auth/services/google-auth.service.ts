import { Injectable, InternalServerErrorException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { CookieService } from '@/common/services';
import { AuthResponse } from '../dto';
import { AuthService } from './auth.service';

// TODO: remove this and use the user type from the database schema
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  async handleGoogleAuth(
    googleUser: GoogleUser,
    res: Response,
  ): Promise<SuccessResponse<AuthResponse>> {
    try {
      let [user] = await db.select().from(users).where(eq(users.email, googleUser.email)).limit(1);

      if (!user) {
        this.logger.log(`Creating new user from Google OAuth: ${googleUser.email}`);
        [user] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            name: googleUser.name,
            password: '', // No password for OAuth users
          })
          .returning();
      }

      this.logger.log(`User authenticated via Google: ${user.id} (${user.email})`);

      const tokens = await this.authService.generateTokens(user.id, user.email);

      this.cookieService.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

      return successResponse(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
        'User authenticated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      this.logger.error(`Google OAuth error: ${error}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to authenticate with Google',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
