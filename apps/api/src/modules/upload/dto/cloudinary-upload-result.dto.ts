import { ApiProperty } from '@nestjs/swagger';

export class CloudinaryUploadResultDto {
  @ApiProperty({
    description: 'Cloudinary public ID',
    example: 'operia/general/1770055839341-chef',
  })
  public_id: string;

  @ApiProperty({
    description: 'Public URL (non-secure)',
    example:
      'http://res.cloudinary.com/dzyxpwpcb/image/upload/operia/general/1770055839341-chef.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Secure HTTPS URL',
    example:
      'https://res.cloudinary.com/dzyxpwpcb/image/upload/operia/general/1770055839341-chef.jpg',
  })
  secure_url: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 102400,
  })
  size: number;

  @ApiProperty({
    description: 'File format/extension',
    example: 'jpg',
  })
  format: string;

  @ApiProperty({
    description: 'Resource type (image, video, raw)',
    example: 'image',
  })
  resource_type: string;
}
