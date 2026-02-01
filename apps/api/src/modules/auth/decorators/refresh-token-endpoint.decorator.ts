import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessRefreshTokenResponseDto, ErrorResponseDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthRefreshTokenDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Uses a valid refresh token from HTTP-only cookie to obtain a new access and refresh token pair. The refresh token is validated via JWT strategy and set in new HTTP-only cookies.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Token successfully refreshed with new tokens in HTTP-only cookies',
      type: SuccessRefreshTokenResponseDto,
      example: AuthExamples.refreshToken.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or expired refresh token',
      type: ErrorResponseDto,
      example: AuthExamples.refreshToken.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during token refresh',
      type: ErrorResponseDto,
      example: AuthExamples.refreshToken.response.internalServerError,
    }),
  );
}
