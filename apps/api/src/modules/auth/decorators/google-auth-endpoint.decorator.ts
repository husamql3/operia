import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessAuthResponseDto, ErrorResponseDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthGoogleDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.FOUND),
    ApiOperation({
      summary: 'Initiate Google OAuth flow',
      description:
        'Redirects to Google OAuth login. After user authorization, redirects back to callback URL.',
    }),
    ApiResponse({
      status: HttpStatus.FOUND,
      description: 'Redirect to Google OAuth consent screen',
    }),
  );
}

export function AuthGoogleCallbackDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Google OAuth callback',
      description:
        'Handles Google OAuth redirect. Authenticates or registers user and sets HTTP-only cookies.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User authenticated successfully with Google',
      type: SuccessAuthResponseDto,
      example: AuthExamples.googleAuth?.response?.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid authorization code or OAuth error',
      type: ErrorResponseDto,
      example: AuthExamples.googleAuth?.response?.error,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during OAuth process',
      type: ErrorResponseDto,
      example: AuthExamples.googleAuth?.response?.internalServerError,
    }),
  );
}
