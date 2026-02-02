import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InitiateOAuthResponseDto } from '../dto';
import { ErrorResponseDto } from '@/common/dto';
import { NotionExamples } from '@/constants/examples';

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
      type: InitiateOAuthResponseDto,
      example: NotionExamples.initiateOAuth.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to generate authorization URL',
      type: ErrorResponseDto,
    }),
  );
}
