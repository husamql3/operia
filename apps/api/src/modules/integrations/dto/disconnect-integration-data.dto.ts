import { ApiProperty } from '@nestjs/swagger';

export class DisconnectIntegrationDataDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;
}
