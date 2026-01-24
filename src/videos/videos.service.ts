import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
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

  async create(userId: string, title: string, fileKey: string): Promise<Video> {
    const video = new this.videoModel({ 
      userId, 
      title, 
      filename: fileKey,  // Now stores MinIO object key
      status: 'pending' 
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

  async delete(id: string, userId: string): Promise<void> {
    const video = await this.findById(id);
    if (video.userId !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    
    await this.storageService.deleteVideo(video.filename);
    await this.videoModel.deleteOne({ _id: id });
  }
}
