import { ApiProperty } from '@nestjs/swagger';

export class DisconnectIntegrationResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Integration disconnected successfully',
  })
  message: string;
}
