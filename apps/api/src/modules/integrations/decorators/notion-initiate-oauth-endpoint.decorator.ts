import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotionExamples } from '@/constants/examples';
import { ErrorResponseDto } from '@/common/dto';
import { InitiateOAuthSuccessResponseDto } from '../dto';

export function NotionInitiateOAuthDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get Notion OAuth authorization URL',
      description:
        'Generates and returns the Notion OAuth authorization URL with CSRF protection. User should be redirected to this URL to authorize the application.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Authorization URL generated successfully',
      type: InitiateOAuthSuccessResponseDto,
      example: NotionExamples.initiateOAuth.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
    }),
  );
}
