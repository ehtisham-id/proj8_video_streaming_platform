import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from './schemas/video.schema';
import { StorageService } from '../storage/storage.service';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    private storageService: StorageService,
    private kafkaService: KafkaService,
  ) {}

  async create(
    userId: string,
    title: string | undefined,
    fileKey: string,
  ): Promise<Video> {
    const videoTitle = title || fileKey.split('/').pop() || 'Untitled';

    const video = new this.videoModel({
      userId,
      title: videoTitle,
      filename: fileKey, // stores MinIO object key
      status: 'pending',
    });

    const saved = await video.save();

    // Emit Kafka event with MinIO key
    await this.kafkaService.emit('video.uploaded', {
      videoId: saved._id.toString(),
      userId,
      filename: fileKey, // MinIO object key
    });

    return saved;
  }

  async findById(id: string): Promise<Video> {
    const video = await this.videoModel.findById(id).lean();
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async findAll(): Promise<Video[]> {
    return this.videoModel.find({ status: { $ne: 'pending' } }).lean();
  }

  async delete(
    id: string,
    userId: string | { toString(): string },
  ): Promise<void> {
    const video = await this.findById(id);
    // Normalize both IDs to string to avoid mismatches between ObjectId and string
    const requesterId =
      typeof userId === 'object' && userId?.toString
        ? userId.toString()
        : String(userId);
    const ownerId =
      typeof video.userId === 'object' && (video.userId as any)?.toString
        ? (video.userId as any).toString()
        : String(video.userId);
    // Debug logging to help troubleshoot authorization mismatch (will show in service logs)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const debugInfo = { requestedBy: requesterId, owner: ownerId };
    if (ownerId !== requesterId) {
      // include debug info in thrown error for visibility in logs during development
      // but do not leak sensitive info to clients
      // eslint-disable-next-line no-console
      console.debug('videos.delete authorization failed', debugInfo);
      throw new ForbiddenException('Not authorized');
    }

    await this.storageService.deleteVideo(video.filename);
    await this.videoModel.deleteOne({ _id: id });
  }
}
