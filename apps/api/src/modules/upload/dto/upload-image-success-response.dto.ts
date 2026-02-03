import { ApiProperty } from '@nestjs/swagger';
import { CloudinaryUploadResultDto } from './cloudinary-upload-result.dto';

export class UploadImageSuccessResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 201,
  })
  code: number;

  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Image uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Upload result data',
    type: CloudinaryUploadResultDto,
  })
  data: CloudinaryUploadResultDto;

  @ApiProperty({
    description: 'ISO timestamp',
    example: '2026-01-18T12:00:00.000Z',
  })
  timestamp: string;
}
