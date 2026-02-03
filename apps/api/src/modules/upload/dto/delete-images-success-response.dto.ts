import { ApiProperty } from '@nestjs/swagger';
import { CloudinaryDeleteResultDto } from './cloudinary-delete-result.dto';

export class DeleteImagesSuccessResponseDto {
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
    example: 'Images deleted',
  })
  message: string;

  @ApiProperty({
    description: 'Deletion result data',
    type: CloudinaryDeleteResultDto,
  })
  data: CloudinaryDeleteResultDto;

  @ApiProperty({
    description: 'ISO timestamp',
    example: '2026-01-18T12:00:00.000Z',
  })
  timestamp: string;
}
