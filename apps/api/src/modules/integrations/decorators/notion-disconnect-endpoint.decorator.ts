import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DisconnectIntegrationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/common/dto';
import { NotionExamples } from '@/constants/examples';

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
      type: DisconnectIntegrationResponseDto,
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
