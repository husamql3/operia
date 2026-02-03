import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotionExamples } from '@/constants/examples';
import { ErrorResponseDto } from '@/common/dto';
import { GetIntegrationStatusSuccessResponseDto } from '../dto';

export function NotionStatusDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get Notion integration status',
      description:
        'Retrieves the current status of the Notion integration for the authenticated user.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Integration status retrieved successfully',
      type: GetIntegrationStatusSuccessResponseDto,
      examples: {
        connected: {
          summary: 'Notion is connected',
          value: NotionExamples.getStatus.response.connected,
        },
        notConnected: {
          summary: 'Notion is not connected',
          value: NotionExamples.getStatus.response.notConnected,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
      example: NotionExamples.getStatus.response.unauthorized,
    }),
  );
}
