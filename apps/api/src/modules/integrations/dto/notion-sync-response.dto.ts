import { ApiProperty } from '@nestjs/swagger';

class NotionSyncDataDto {
  @ApiProperty({
    description: 'Total number of pages processed',
    example: 50,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Number of proposals extracted from all pages',
    example: 14,
  })
  proposalsCount: number;

  @ApiProperty({
    description: 'Array of extracted proposals',
    type: 'array',
    example: [
      {
        id: 'proposal-1',
        type: 'create_task',
        title: 'Build extension to track last read project',
        description: 'Create a browser extension for tracking purposes',
        evidence: ['Quote from content'],
        rationale: 'Why this was proposed',
        whatWillHappen: 'If approved, this will be saved to your task list for tracking',
        owner: 'User',
        deadline: null,
        priority: 'medium',
      },
    ],
  })
  proposals: any[];

  @ApiProperty({
    description: 'Unique batch ID for this extraction',
    example: 'c01feb76-3160-499f-a815-e9b9bfb9d249',
  })
  proposalBatchId: string;
}

export class NotionSyncResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Notion content synced and extracted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: NotionSyncDataDto,
  })
  data: NotionSyncDataDto;

  @ApiProperty({
    description: 'ISO timestamp of the response',
    example: '2026-02-06T14:54:03.912Z',
  })
  timestamp: string;
}
