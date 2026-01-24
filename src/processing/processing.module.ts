import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { VideosModule } from '../videos/videos.module';
import { ProcessingService } from './processing.service';
import { StorageModule } from '@src/storage/storage.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Video, VideoSchema } from '../videos/schemas/video.schema';

@Module({
  imports: [KafkaModule, VideosModule, StorageModule, MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }])],
  providers: [ProcessingService],
})
export class ProcessingModule {}
