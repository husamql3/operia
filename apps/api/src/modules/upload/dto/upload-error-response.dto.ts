import { ApiProperty } from '@nestjs/swagger';

export class UploadErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  code: number;

  @ApiProperty({
    description: 'Success indicator',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'No file uploaded',
  })
  message: string;

  @ApiProperty({
    description: 'Error type/name',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'ISO timestamp',
    example: '2026-01-18T12:00:00.000Z',
  })
  timestamp: string;
}
