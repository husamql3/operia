import { ApiProperty } from '@nestjs/swagger';

class GetPagesDataDto {
  @ApiProperty({
    description: 'Map of Notion pages indexed by page ID',
    example: {
      '123e4567-e89b-12d3-a456-426614174000': {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'My Page',
        url: 'https://notion.so/My-Page-123e4567e89b12d3a456426614174000',
      },
    },
  })
  pages: Record<string, { id: string; title: string; url: string }>;
}

export class GetPagesResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Pages retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: GetPagesDataDto,
  })
  data: GetPagesDataDto;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2025-11-28T10:00:00.000Z',
  })
  timestamp: string;
}
