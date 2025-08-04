import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import * as fs from 'fs';
import {
  StorageProvider,
  StorageUploadResult,
  StorageDownloadResult,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class MinioStorageProvider implements StorageProvider {
  private readonly logger = new Logger(MinioStorageProvider.name);
  private readonly minioClient: MinioClient;

  constructor(
    private readonly endPoint: string,
    private readonly port: number,
    private readonly useSSL: boolean,
    private readonly accessKey: string,
    private readonly secretKey: string,
    private readonly bucketName: string,
    private readonly publicUrl?: string,
  ) {
    try {
      this.minioClient = new MinioClient({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      });

      // Ensure bucket exists
      this.ensureBucketExists();
    } catch (error) {
      throw new Error(`Failed to initialize MINIO client: ${error.message}`);
    }
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);
      }
    } catch (error) {
      this.logger.error(
        `Error ensuring bucket exists: ${error.message}`,
        error.stack,
        MinioStorageProvider.name,
      );
    }
  }

  async uploadFile(
    filePath: string,
    fileName: string,
    makePublic: boolean = true,
  ): Promise<StorageUploadResult> {
    try {
      // Get file stats for metadata
      const fileStats = fs.statSync(filePath);
      const fileStream = fs.createReadStream(filePath);

      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        fileStream,
        fileStats.size,
      );

      // Set public policy if needed
      if (makePublic) {
        await this.setObjectPolicy(fileName);
      }

      // Generate public URL
      const url = this.generatePublicUrl(fileName);

      return {
        url,
        fileName,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack, MinioStorageProvider.name);
      throw new BadRequestException(
        'Error al guardar los archivos en el servidor',
      );
    }
  }

  async downloadFile(fileName: string): Promise<StorageDownloadResult> {
    try {
      const dataStream = await this.minioClient.getObject(
        this.bucketName,
        fileName,
      );

      // Convert stream to buffer
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        dataStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            name: fileName,
          });
        });

        dataStream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(error.message, error.stack, MinioStorageProvider.name);
      throw new NotFoundException('Multimedia no encontrado');
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
    } catch (error) {
      this.logger.error(error.message, error.stack, MinioStorageProvider.name);
      throw new BadRequestException('Error al eliminar el archivo');
    }
  }

  private async setObjectPolicy(fileName: string): Promise<void> {
    try {
      // MINIO doesn't have per-object public access like Firebase
      // Instead, we can set a bucket policy for public read access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${this.bucketName}/*`,
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(policy),
      );
    } catch (error) {
      this.logger.warn(
        `Could not set public policy for object ${fileName}: ${error.message}`,
        MinioStorageProvider.name,
      );
    }
  }

  private generatePublicUrl(fileName: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${this.bucketName}/${fileName}`;
    }

    const protocol = this.useSSL ? 'https' : 'http';
    const port = this.port === 80 || this.port === 443 ? '' : `:${this.port}`;
    return `${protocol}://${this.endPoint}${port}/${this.bucketName}/${fileName}`;
  }
}
