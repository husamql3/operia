import { ApiProperty } from '@nestjs/swagger';
import { IntegrationStatusResponseDto } from './integration-status-response.dto';

export class GetIntegrationStatusSuccessResponseDto {
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
    example: 'Integration status retrieved',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: IntegrationStatusResponseDto,
  })
  data: IntegrationStatusResponseDto;

  @ApiProperty({
    description: 'ISO timestamp',
    example: '2025-11-28T10:00:00.000Z',
  })
  timestamp: string;
}
