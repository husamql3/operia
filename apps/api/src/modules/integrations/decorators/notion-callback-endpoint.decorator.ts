import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/dto';

export function NotionCallbackDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.FOUND),
    ApiOperation({
      summary: 'Notion OAuth callback handler',
      description:
        'Handles the redirect from Notion after user authorization. Exchanges the authorization code for an access token and redirects back to the frontend with integration data.',
    }),
    ApiQuery({
      name: 'code',
      type: 'string',
      description: 'Authorization code from Notion',
      required: true,
    }),
    ApiQuery({
      name: 'state',
      type: 'string',
      description: 'CSRF protection state token',
      required: true,
    }),
    ApiQuery({
      name: 'error',
      type: 'string',
      description: 'Error code if authorization failed',
      required: false,
    }),
    ApiResponse({
      status: HttpStatus.FOUND,
      description: 'Redirect to frontend with integration data or error',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid authorization code or missing code parameter',
      type: ErrorResponseDto,
    }),
  );
}
