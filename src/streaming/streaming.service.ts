import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { VideosService } from '../videos/videos.service';
import { MasterPlaylistService } from './master-playlist.service';

@Injectable()
export class StreamingService {
  constructor(
    private videosService: VideosService,
    private masterPlaylistService: MasterPlaylistService,
  ) {}

  async getMasterPlaylist(videoId: string): Promise<string> {
    const video = await this.videosService.findById(videoId);
    
    // Check if master playlist exists, regenerate if needed
    const masterPath = path.join('./videos/processed', videoId, 'master.m3u8');
    if (await fs.pathExists(masterPath)) {
      return fs.readFile(masterPath, 'utf8');
    }

    const masterPlaylist = this.masterPlaylistService.generateMasterPlaylist(video);
    await this.masterPlaylistService.saveMasterPlaylist(videoId, masterPlaylist);
    return masterPlaylist;
  }

  async getQualityPlaylist(videoId: string, quality: string): Promise<string> {
    const video = await this.videosService.findById(videoId);
    const qualityInfo = video.qualities?.find(q => `${q.height}p` === quality);
    
    if (!qualityInfo) {
      throw new NotFoundException('Quality not available');
    }

    const playlistPath = path.join('./videos/processed', videoId, quality, 'playlist.m3u8');
    if (!await fs.pathExists(playlistPath)) {
      throw new NotFoundException('Playlist not found');
    }

    return fs.readFile(playlistPath, 'utf8');
  }

  async getSegmentPath(videoId: string, quality: string, seq: number): Promise<string> {
    const paddedSeq = seq.toString().padStart(3, '0');
    const segmentPath = path.join('./videos/processed', videoId, quality, `segment_${paddedSeq}.ts`);
    
    if (!await fs.pathExists(segmentPath)) {
      throw new NotFoundException('Segment not found');
    }
    
    return segmentPath;
  }

  async getAvailableQualities(videoId: string): Promise<string[]> {
    const video = await this.videosService.findById(videoId);
    return video.qualities?.map(q => `${q.height}p`) || [];
  }
}
