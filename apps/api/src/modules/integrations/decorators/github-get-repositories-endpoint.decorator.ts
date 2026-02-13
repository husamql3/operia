import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto';

export function GitHubGetRepositoriesDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get GitHub repositories',
      description: "Retrieves a list of repositories from the authenticated GitHub user's account.",
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Repositories retrieved successfully',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Repositories retrieved successfully',
          data: {
            repositories: [
              {
                id: 1234567,
                name: 'my-repo',
                full_name: 'username/my-repo',
                html_url: 'https://github.com/username/my-repo',
                description: 'A sample repository',
              },
            ],
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
  );
}
