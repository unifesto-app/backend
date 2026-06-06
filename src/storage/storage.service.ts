import {
  Injectable,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    // Get AWS configuration from environment variables
    this.region = this.configService.get<string>('AWS_REGION') || '';
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || '';

    // Initialize S3 Client with IAM role credentials (no hardcoded keys)
    this.s3Client = new S3Client({
      region: this.region,
      // Credentials automatically obtained from EC2 instance profile
    });
  }

  onModuleInit() {
    this.logger.log(
      `StorageService initialized with bucket: ${this.bucketName}, region: ${this.region}`,
    );
  }

  /**
   * Upload a file to S3 with specified key prefix
   * @param file - Multer file object
   * @param prefix - S3 key prefix (e.g., 'avatars/', 'space-logos/', 'space-banners/')
   * @param identifier - Unique identifier for the file (e.g., userId, spaceId)
   * @returns Public URL of uploaded file
   * @throws ConflictException if upload fails
   */
  async uploadFile(
    file: Express.Multer.File,
    prefix: string,
    identifier: string,
  ): Promise<string> {
    try {
      // Generate timestamped filename: {identifier}-{timestamp}.{extension}
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      const key = `${prefix}${identifier}-${timestamp}.${extension}`;

      this.logger.log(
        `Uploading file to S3: bucket=${this.bucketName}, key=${key}, size=${file.size}, mimeType=${file.mimetype}`,
      );

      // Create PutObject command with appropriate headers
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype, // Set Content-Type header based on MIME type
      });

      // Execute S3 upload
      await this.s3Client.send(command);

      // Generate S3 public URL
      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`Successfully uploaded file to S3: ${s3Url}`);

      return s3Url;
    } catch (error) {
      this.logger.error('S3 upload failed', {
        bucket: this.bucketName,
        prefix,
        identifier,
        fileSize: file.size,
        mimeType: file.mimetype,
        error: error.message,
      });

      throw new ConflictException(
        `Failed to upload file: ${error.message || 'S3 error'}`,
      );
    }
  }
}
