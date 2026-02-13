import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationStatusResponseDto } from '../dto';
import { ErrorResponseDto } from '@/common/dto';

export function GitHubStatusDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get GitHub integration status',
      description:
        'Retrieves the current status of the GitHub integration for the authenticated user.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Integration status retrieved successfully',
      type: IntegrationStatusResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
    }),
  );
}
