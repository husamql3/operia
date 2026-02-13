import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto';

export function GitHubDisconnectDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Disconnect GitHub integration',
      description: 'Removes the GitHub integration for the authenticated user.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Integration disconnected successfully',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Integration disconnected successfully',
          data: { success: true },
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
