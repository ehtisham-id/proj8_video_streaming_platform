import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KafkaService } from '../kafka/kafka.service';
import { StorageService } from '../storage/storage.service';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Video, VideoDocument } from '../videos/schemas/video.schema';
import { Consumer } from 'kafkajs';

interface ProcessingJob {
  videoId: string;
  userId: string;
  filename: string;
}

interface VideoQuality {
  label: string;
  height: number;
  bitrate: string;
  playlist: string;
}

@Injectable()
export class ProcessingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessingService.name);

  private consumer?: Consumer;

  private readonly tempDir = './videos/temp';
  private readonly outputDir = './videos/processed';

  private readonly qualities = [
    { label: '240p', height: 240, bitrate: '400k' },
    { label: '480p', height: 480, bitrate: '1000k' },
    { label: '720p', height: 720, bitrate: '2500k' },
  ];

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly storageService: StorageService,
    @InjectModel(Video.name)
    private readonly videoModel: Model<VideoDocument>,
  ) {
    fs.ensureDirSync(this.tempDir);
    fs.ensureDirSync(this.outputDir);
  }

  async onModuleInit() {
    try {
      this.consumer = this.kafkaService.getConsumer('video-processor');
      await this.consumer.connect();

      await this.consumer.subscribe({
        topic: 'video.uploaded',
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;

          const job: ProcessingJob = JSON.parse(message.value.toString());

          try {
            await this.kafkaService.emit('video.processing.started', job);

            await this.processVideo(job);

            await this.kafkaService.emit('video.processing.completed', {
              videoId: job.videoId,
            });
          } catch (err: unknown) {
            const error = err instanceof Error ? err.message : 'Unknown error';

            this.logger.error(error);

            await this.kafkaService.emit('video.processing.failed', {
              videoId: job.videoId,
              error,
            });
          }
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      this.logger.error(message);
      // rethrow so Nest knows module init failed
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }

  private async processVideo(job: ProcessingJob): Promise<void> {
    const inputPath = path.join(this.tempDir, path.basename(job.filename));

    await this.storageService.downloadToFile(job.filename, inputPath);

    await this.videoModel.updateOne(
      { _id: job.videoId },
      { status: 'processing' },
    );

    const qualitiesMeta: VideoQuality[] = [];

    for (const q of this.qualities) {
      const qDir = path.join(this.outputDir, job.videoId, q.label);

      const playlistPath = path.join(qDir, 'playlist.m3u8');
      await fs.ensureDir(qDir);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters(`scale=-2:${q.height}`)
          .videoBitrate(q.bitrate)
          .outputOptions([
            '-hls_time 6',
            '-hls_list_size 0',
            '-hls_segment_filename',
            `${qDir}/segment_%03d.ts`,
          ])
          .output(playlistPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      for (const file of await fs.readdir(qDir)) {
        await this.storageService.uploadFile(
          path.join(qDir, file),
          `videos/processed/${job.videoId}/${q.label}/${file}`,
        );
      }

      qualitiesMeta.push({
        label: q.label,
        height: q.height,
        bitrate: q.bitrate,
        playlist: `videos/processed/${job.videoId}/${q.label}/playlist.m3u8`,
      });
    }

    await this.videoModel.updateOne(
      { _id: job.videoId },
      {
        status: 'ready',
        qualities: qualitiesMeta,
      },
    );

    await fs.remove(inputPath);
    await fs.remove(path.join(this.outputDir, job.videoId));
  }
}
