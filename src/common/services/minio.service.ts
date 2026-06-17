import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private readonly logger = new Logger(MinioService.name);

  constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    await this.ensureBucket('commission-pv');
    await this.ensureBucket('commission-exports');
  }

  private async ensureBucket(bucketName: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName, 'us-east-1');
        this.logger.log(`Bucket '${bucketName}' created`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not ensure bucket '${bucketName}': ${error.message}`,
      );
    }
  }

  async uploadFile(
    bucket: string,
    fileName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      await this.client.putObject(bucket, fileName, buffer, buffer.length, {
        'Content-Type': contentType,
      });

      const endpoint = this.configService.get('MINIO_ENDPOINT', 'localhost');
      const port = this.configService.get<number>('MINIO_PORT', 9000);
      const useSSL =
        this.configService.get('MINIO_USE_SSL', 'false') === 'true';
      const protocol = useSSL ? 'https' : 'http';

      return `${protocol}://${endpoint}:${port}/${bucket}/${fileName}`;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async getPresignedUrl(
    bucket: string,
    fileName: string,
    expiry = 3600,
  ): Promise<string> {
    try {
      return await this.client.presignedGetObject(bucket, fileName, expiry);
    } catch (error) {
      this.logger.error(`Failed to get presigned URL: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(bucket: string, fileName: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, fileName);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async fileExists(bucket: string, fileName: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, fileName);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStream(
    bucket: string,
    fileName: string,
  ): Promise<NodeJS.ReadableStream> {
    try {
      return await this.client.getObject(bucket, fileName);
    } catch (error) {
      this.logger.error(`Failed to get file stream: ${error.message}`);
      throw error;
    }
  }

  async getFileStat(
    bucket: string,
    fileName: string,
  ): Promise<Minio.BucketItemStat> {
    return this.client.statObject(bucket, fileName);
  }
}
