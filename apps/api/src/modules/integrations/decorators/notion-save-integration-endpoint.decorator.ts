import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SaveNotionIntegrationDto, SaveIntegrationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/common/dto';

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
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Integration saved successfully',
      type: SaveIntegrationResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
    }),
  );
}
