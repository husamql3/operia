import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto';

export function GitHubSyncDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Sync and extract GitHub content',
      description:
        'Syncs repositories from GitHub and extracts actionable tasks and proposals using AI analysis.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'GitHub content synced and extracted successfully',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'GitHub content synced and extracted successfully',
          data: {
            totalRepositories: 5,
            proposalsCount: 3,
            proposals: [],
            proposalBatchId: '550e8400-e29b-41d4-a716-446655440000',
          },
          timestamp: new Date().toISOString(),
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No GitHub integration found',
      schema: {
        example: {
          code: 404,
          success: false,
          message: 'No GitHub integration found',
          data: null,
          timestamp: new Date().toISOString(),
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
      type: ErrorResponseDto,
    }),
  );
}
