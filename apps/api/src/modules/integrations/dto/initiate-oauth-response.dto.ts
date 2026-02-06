import { ApiProperty } from '@nestjs/swagger';

export class InitiateOAuthResponseDto {
  @ApiProperty({
    description: 'Notion OAuth authorization URL',
    example:
      'https://api.notion.com/v1/oauth/authorize?client_id=xxx&redirect_uri=http://localhost:3000/api/integrations/notion/callback&response_type=code&owner=user&state=abc123def456',
  })
  authUrl: string;

  @ApiProperty({
    description: 'CSRF protection state token',
    example: 'abc123def456',
  })
  state: string;
}
