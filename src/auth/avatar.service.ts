import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import sharp from 'sharp';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly BUCKET_NAME = 'avatars';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly MAX_WIDTH = 800;
  private readonly MAX_HEIGHT = 800;
  private readonly COMPRESSION_QUALITY = 80;

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Upload and compress avatar
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      // Validate file
      this.validateFile(file);

      // Compress image
      const compressedBuffer = await this.compressImage(file.buffer);

      // Generate filename
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      // Delete old avatars
      await this.deleteUserAvatars(userId);

      // Upload to Supabase Storage
      const { data, error } = await this.supabaseService
        .getClient()
        .storage.from(this.BUCKET_NAME)
        .upload(filePath, compressedBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        this.logger.error(`Upload error: ${error.message}`);
        throw new BadRequestException('Failed to upload avatar');
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabaseService
        .getClient()
        .storage.from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      this.logger.log(`Avatar uploaded for user: ${userId}`);
      return publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Unexpected error in uploadAvatar: ${error.message}`);
      throw new BadRequestException('Failed to upload avatar');
    }
  }

  /**
   * Delete user's avatars
   */
  async deleteUserAvatars(userId: string): Promise<void> {
    try {
      const { data: files } = await this.supabaseService
        .getClient()
        .storage.from(this.BUCKET_NAME)
        .list(userId);

      if (files && files.length > 0) {
        const filesToDelete = files.map((file) => `${userId}/${file.name}`);
        await this.supabaseService
          .getClient()
          .storage.from(this.BUCKET_NAME)
          .remove(filesToDelete);

        this.logger.log(`Deleted ${files.length} old avatars for user: ${userId}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete old avatars: ${error.message}`);
      // Don't throw - this is not critical
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`,
      );
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Compress image using sharp
   */
  private async compressImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(this.MAX_WIDTH, this.MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: this.COMPRESSION_QUALITY })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Image compression error: ${error.message}`);
      throw new BadRequestException('Failed to process image');
    }
  }
}
