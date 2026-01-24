import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Video, VideoSchema } from './schemas/video.schema';
import { StorageService } from '../storage/storage.service'; // Updated
import { KafkaService } from '../kafka/kafka.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }]), UsersModule],
  controllers: [VideosController],
  providers: [VideosService, StorageService, KafkaService],
  exports: [VideosService],
})
export class VideosModule {}
