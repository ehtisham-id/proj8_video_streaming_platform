import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as stream from 'stream/promises';
import Multer from 'multer';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private readonly bucket = 'videos';

  constructor() {
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      },
      forcePathStyle: true,
    });
  }

  async saveVideo(file: Multer.File, userId: string): Promise<string> {
    const key = `videos/original/${userId}/${uuidv4()}-${file.originalname}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  async getVideoUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  async deleteVideo(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  // ✅ MISSING — NOW ADDED
  async downloadToFile(key: string, destPath: string): Promise<void> {
    const response = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!response.Body) {
      throw new Error('Empty object body from MinIO');
    }

    await stream.pipeline(response.Body as any, fs.createWriteStream(destPath));
  }

  // ✅ MISSING — NOW ADDED
  async uploadFile(localPath: string, key: string): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fs.createReadStream(localPath),
      }),
    );
  }

  async listVideos(userId: string): Promise<string[]> {
    const result = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: `videos/original/${userId}/`,
      }),
    );

    return result.Contents?.map(o => o.Key!) ?? [];
  }
}
