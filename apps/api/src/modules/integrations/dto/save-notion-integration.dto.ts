import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveNotionIntegrationDto {
  @ApiProperty({
    description: 'Notion API access token',
    example: 'secret_cc0a436ea0df47d99d2fd819aa74a27c',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    description: 'Notion workspace ID',
    example: '338e1050-fe24-4db2-b6ea-fcdc6d537211',
  })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'Notion workspace name',
    example: "Jeff's Workspace",
  })
  @IsString()
  @IsNotEmpty()
  workspaceName: string;

  @ApiProperty({
    description: 'Notion bot ID',
    example: '05e730a8-85e2-410a-9a5d-c0b55bdf7556',
  })
  @IsString()
  @IsNotEmpty()
  botId: string;
}
