import { ApiProperty } from '@nestjs/swagger';

export class CloudinaryDeleteResultDto {
  @ApiProperty({
    description: 'Results of deletion operations',
    type: 'object',
    additionalProperties: {
      type: 'string',
      example: 'ok',
    },
    example: {
      'operia/general/1770055839341-chef': 'ok',
      'operia/general/1770055839342-product': 'ok',
    },
  })
  results: Record<string, string>;

  @ApiProperty({
    description: 'Number of successfully deleted files',
    example: 2,
  })
  success: number;

  @ApiProperty({
    description: 'Number of failed deletions',
    example: 0,
  })
  failed: number;
}
