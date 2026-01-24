import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { MasterPlaylistService } from './master-playlist.service';

@Module({
  imports: [VideosModule],
  controllers: [StreamingController],
  providers: [StreamingService, MasterPlaylistService],
})
export class StreamingModule {}
