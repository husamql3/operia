import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SaveNotionIntegrationDto, SaveIntegrationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/common/dto';
import { NotionExamples } from '@/constants/examples';

export function NotionSaveIntegrationDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Save Notion integration',
      description:
        'Saves the Notion integration credentials for the authenticated user. Requires valid JWT authentication. Should be called after OAuth callback returns token data.',
    }),
    ApiBody({
      type: SaveNotionIntegrationDto,
      description: 'Notion integration data from OAuth callback',
      examples: {
        success: {
          summary: 'Valid save integration request',
          value: NotionExamples.saveIntegration.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Integration saved successfully',
      type: SaveIntegrationResponseDto,
      example: NotionExamples.saveIntegration.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request data',
      type: ErrorResponseDto,
      example: NotionExamples.saveIntegration.response.badRequest,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
      example: NotionExamples.saveIntegration.response.unauthorized,
    }),
  );
}
