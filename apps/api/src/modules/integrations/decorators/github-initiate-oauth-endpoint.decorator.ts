import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InitiateOAuthSuccessResponseDto } from '../dto';
import { ErrorResponseDto } from '@/common/dto';

export function GitHubInitiateOAuthDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get GitHub OAuth authorization URL',
      description:
        'Generates and returns the GitHub OAuth authorization URL with CSRF protection. User should be redirected to this URL to authorize the application.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Authorization URL generated successfully',
      type: InitiateOAuthSuccessResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
    }),
  );
}
