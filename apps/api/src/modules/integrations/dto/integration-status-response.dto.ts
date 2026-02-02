import { ApiProperty } from '@nestjs/swagger';
import { IntegrationDto } from './integration.dto';

export class IntegrationStatusResponseDto {
  @ApiProperty({
    description: 'Whether Notion is connected',
    example: true,
  })
  connected: boolean;

  @ApiProperty({
    description: 'Connected workspace name or null',
    example: "Jeff's Workspace",
    nullable: true,
  })
  workspace: string | null;

  @ApiProperty({
    description: 'Integration details or null if not connected',
    type: IntegrationDto,
    nullable: true,
  })
  integration: IntegrationDto | null;
}
