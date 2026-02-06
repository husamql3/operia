import { ApiProperty } from '@nestjs/swagger';
import { IntegrationDto } from './integration.dto';

export class SaveIntegrationResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Connected workspace name',
    example: "Jeff's Workspace",
  })
  workspace: string;

  @ApiProperty({
    description: 'Integration details',
    type: IntegrationDto,
  })
  integration: IntegrationDto;
}
