import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Invalid credentials',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 401,
    type: 'number',
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error type/name',
    example: 'UnauthorizedException',
    type: 'string',
  })
  error: string;
}
