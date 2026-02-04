import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotionExamples } from '@/constants/examples';
import { ErrorResponseDto } from '@/common/dto';
import { GetPagesResponseDto } from '../dto';

export function NotionGetPagesDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get Notion workspace pages',
      description:
        'Retrieves all workspace-level pages from the connected Notion workspace. Pages are returned as a map indexed by page ID for efficient client-side lookups.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Pages retrieved successfully',
      type: GetPagesResponseDto,
      example: NotionExamples.getPages.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid JWT authentication',
      type: ErrorResponseDto,
      example: NotionExamples.getPages.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No Notion integration found for user',
      type: GetPagesResponseDto,
      example: NotionExamples.getPages.response.notFound,
    }),
  );
}
