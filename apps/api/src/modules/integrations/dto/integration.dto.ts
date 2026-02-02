import { ApiProperty } from '@nestjs/swagger';

export class IntegrationDto {
  @ApiProperty({
    description: 'Integration ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Integration type',
    example: 'notion',
  })
  type: string;

  @ApiProperty({
    description: 'Workspace name',
    example: "Jeff's Workspace",
    nullable: true,
  })
  workspaceName: string | null;
}
