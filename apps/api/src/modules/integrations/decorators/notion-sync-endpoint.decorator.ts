import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotionExamples } from '@/constants/examples';
import { ErrorResponseDto } from '@/common/dto';
import { NotionSyncResponseDto } from '../dto';

export function NotionSyncDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Sync and extract content from all Notion pages',
      description:
        'Fetches all pages from the connected Notion workspace and automatically extracts actionable tasks, proposals, and insights using AI analysis. Analyzes all pages in a single request and returns extracted proposals.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Pages synced and content extracted successfully',
      type: NotionSyncResponseDto,
      example: NotionExamples.sync.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
      example: NotionExamples.sync.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No Notion integration found for user',
      type: NotionSyncResponseDto,
      example: NotionExamples.sync.response.notFound,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Error syncing and extracting Notion content',
      type: NotionSyncResponseDto,
      example: NotionExamples.sync.response.extractionFailed,
    }),
  );
}
