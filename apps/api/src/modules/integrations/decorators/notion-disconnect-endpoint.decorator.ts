import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotionExamples } from '@/constants/examples';
import { ErrorResponseDto } from '@/common/dto';
import { DisconnectIntegrationSuccessResponseDto } from '../dto';

export function NotionDisconnectDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Disconnect Notion integration',
      description:
        'Removes the Notion integration for the authenticated user. This will delete all stored credentials.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Integration disconnected successfully',
      type: DisconnectIntegrationSuccessResponseDto,
      example: NotionExamples.disconnect.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
      example: NotionExamples.disconnect.response.unauthorized,
    }),
  );
}
