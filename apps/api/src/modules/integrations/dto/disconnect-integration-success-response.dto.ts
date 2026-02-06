import { ApiProperty } from '@nestjs/swagger';
import { DisconnectIntegrationDataDto } from './disconnect-integration-data.dto';

export class DisconnectIntegrationSuccessResponseDto {
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
    example: 'Integration disconnected successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: DisconnectIntegrationDataDto,
  })
  data: DisconnectIntegrationDataDto;

  @ApiProperty({
    description: 'ISO timestamp',
    example: '2025-11-28T10:00:00.000Z',
  })
  timestamp: string;
}
