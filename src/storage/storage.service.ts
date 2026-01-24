import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as stream from 'stream/promises';
import Multer from  'multer';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: 'us-east-1', // MinIO doesn't care about region
      endpoint: process.env.MINIO_ENDPOINT || `http://localhost:9000`,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      },
      forcePathStyle: true, 
    });
  }

  async saveVideo(file: Multer.File, userId: string): Promise<string> {
    const key = `videos/original/${userId}/${uuidv4()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: 'videos',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId,
        originalname: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);
    this.logger.log(`Video uploaded to MinIO: ${key}`);
    
    return key;
  }

  async getVideoUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: 'videos',
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return url;
  }

  async deleteVideo(key: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: 'videos',
      Key: key,
    }));
  }

  async listVideos(userId: string): Promise<string[]> {
    // Implementation for listing user videos
    const command = new ListObjectsV2Command({
      Bucket: 'videos',
      Prefix: `videos/original/${userId}/`,
    });

    const result = await this.s3Client.send(command);
    return result.Contents?.map(obj => obj.Key!) || [];
  }
}
