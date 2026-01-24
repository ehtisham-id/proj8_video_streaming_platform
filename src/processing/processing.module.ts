import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { VideosModule } from '../videos/videos.module';
import { ProcessingService } from './processing.service';

@Module({
  imports: [KafkaModule, VideosModule],
  providers: [ProcessingService],
})
export class ProcessingModule {}
