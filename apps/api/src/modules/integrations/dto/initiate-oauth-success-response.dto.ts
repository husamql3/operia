import { ApiProperty } from '@nestjs/swagger';
import { InitiateOAuthResponseDto } from './initiate-oauth-response.dto';

export class InitiateOAuthSuccessResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Notion OAuth authorization URL generated',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: InitiateOAuthResponseDto,
  })
  data: InitiateOAuthResponseDto;

  @ApiProperty({
    description: 'ISO timestamp',
    example: '2025-11-28T10:00:00.000Z',
  })
  timestamp: string;
}
