import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { MasterPlaylistService } from './master-playlist.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [VideosModule, StorageModule],
  controllers: [StreamingController],
  providers: [StreamingService, MasterPlaylistService],
})
export class StreamingModule {}
