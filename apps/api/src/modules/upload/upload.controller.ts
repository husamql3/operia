import { Controller, Post, Delete, Body, UseGuards, Logger, Query, Req } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import busboy from 'busboy';
import { Request } from 'express';
import { CloudinaryService } from '@/common/services/cloudinary.service';
import { UploadImageDecorator, DeleteImagesDecorator } from './decorators/upload.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { successResponse } from '@/utils/response.handler';

export interface DeleteImageDto {
  urls: string[];
}

@ApiTags('upload')
@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload image to Cloudinary with dynamic folder path
   * @param file - Image file to upload
   * @param folder - Target folder in Cloudinary (e.g., 'operia/chefs', 'operia/products')
   * @returns CloudinaryUploadResult with secure_url
   */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder in Cloudinary' })
  @UploadImageDecorator('Upload image to Cloudinary')
  async uploadImage(@Req() req: Request, @Query('folder') folder: string = 'operia/general') {
    return new Promise((resolve) => {
      try {
        const bufferedChunks: Buffer[] = [];
        let boundaryExtracted = false;
        let realBoundary = '';

        const extractBoundary = (data: Buffer): string => {
          // Look for boundary marker in multipart data (e.g., ------WebKitFormBoundary...)
          const str = data.toString('binary', 0, Math.min(1024, data.length));
          const match = str.match(/--([^\r\n]+)/);
          return match ? match[1] : '';
        };

        const dataHandler = (chunk: Buffer) => {
          bufferedChunks.push(chunk);

          if (!boundaryExtracted) {
            const fullData = Buffer.concat(bufferedChunks);
            const boundary = extractBoundary(fullData);

            if (boundary && boundary !== '') {
              boundaryExtracted = true;
              realBoundary = boundary;

              // Remove data handler - we'll handle the rest with busboy
              req.removeListener('data', dataHandler);

              // Update headers with real boundary
              const headersWithBoundary = {
                ...req.headers,
                'content-type': `multipart/form-data; boundary=${realBoundary}`,
              };

              this.logger.debug(`Extracted boundary: ${realBoundary}`);

              // Create busboy with correct boundary
              const bb = busboy({
                headers: headersWithBoundary,
                limits: { fileSize: 5 * 1024 * 1024 },
              });

              let fileBuffer: Buffer;
              let originalFilename: string;
              let fileMimetype: string;

              bb.on('file', (fieldname, file, fileInfo) => {
                if (fieldname === 'file') {
                  originalFilename = fileInfo.filename;
                  fileMimetype = fileInfo.mimeType;

                  const chunks: Buffer[] = [];
                  file.on('data', (data) => {
                    chunks.push(data);
                  });

                  file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                  });

                  file.on('error', (err) => {
                    const errorMsg =
                      err instanceof Error
                        ? err.message
                        : typeof err === 'string'
                          ? err
                          : 'unknown';
                    this.logger.error(`File stream error: ${errorMsg}`);
                  });
                }
              });

              bb.on('close', () => {
                this.cloudinaryService
                  .uploadFile(fileBuffer, originalFilename, folder, 'image')
                  .then((result) => {
                    if (!fileBuffer || !originalFilename) {
                      this.logger.error('No file provided for upload');
                      return resolve(
                        successResponse({ secure_url: null }, 'No file provided', 400),
                      );
                    }

                    const maxSize = 5 * 1024 * 1024;
                    if (fileBuffer.length > maxSize) {
                      this.logger.error(
                        `File size ${fileBuffer.length} exceeds max size ${maxSize}`,
                      );
                      return resolve(
                        successResponse({ secure_url: null }, 'File size exceeds 5MB', 400),
                      );
                    }

                    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    if (fileMimetype && !allowedMimeTypes.includes(fileMimetype)) {
                      this.logger.error(`Invalid file type: ${fileMimetype}`);
                      return resolve(
                        successResponse(
                          { secure_url: null },
                          'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
                          400,
                        ),
                      );
                    }

                    this.logger.debug(
                      `Uploading image to folder: ${folder}, filename: ${originalFilename}, mimetype: ${fileMimetype}`,
                    );

                    this.logger.log(`Image uploaded to ${folder}: ${result.public_id}`);
                    return resolve(successResponse(result, 'Image uploaded successfully', 201));
                  })
                  .catch((error) => {
                    this.logger.error(
                      `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
                    );
                    return resolve(
                      successResponse(
                        { secure_url: null },
                        'Failed to upload image to Cloudinary',
                        500,
                      ),
                    );
                  });
              });

              bb.on('error', (err) => {
                const errorMsg =
                  err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown';
                this.logger.error(`Busboy error: ${errorMsg}`);
                resolve(successResponse({ secure_url: null }, 'Failed to parse upload', 400));
              });

              // Write buffered data and pipe rest
              if (fullData.length > 0) {
                bb.write(fullData);
              }
              req.pipe(bb);
            }
          }
        };

        req.on('data', dataHandler);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown';
        this.logger.error(`Setup error: ${errorMsg}`);
        return resolve(
          successResponse({ secure_url: null }, 'Failed to process upload request', 500),
        );
      }
    });
  }

  /**
   * Delete images by URL array
   * @param urls - Array of Cloudinary image URLs to delete
   * @returns DeleteImageResult with success/failed counts
   */
  @Delete('images')
  @UseGuards(JwtAuthGuard)
  @DeleteImagesDecorator('Delete images by URLs')
  async deleteImages(@Body() { urls }: DeleteImageDto) {
    this.logger.debug(`Deleting ${urls.length} images`);

    if (!urls || urls.length === 0) {
      this.logger.warn('No URLs provided for deletion');
      return successResponse({ results: {}, success: 0, failed: 0 }, 'No images to delete', 200);
    }

    const result = await this.cloudinaryService.deleteFilesByUrls(urls);

    this.logger.log(`Image deletion completed: ${result.success} success, ${result.failed} failed`);
    return successResponse(result, 'Images deleted', 200);
  }
}
