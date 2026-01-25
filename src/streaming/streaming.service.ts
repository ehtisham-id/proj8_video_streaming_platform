import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { VideosService } from '../videos/videos.service';
import { MasterPlaylistService } from './master-playlist.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class StreamingService {
  constructor(
    private videosService: VideosService,
    private masterPlaylistService: MasterPlaylistService,
    private storageService: StorageService,
  ) {}

  async getMasterPlaylist(videoId: string): Promise<string> {
    const video = await this.videosService.findById(videoId);

    // Check if master playlist exists, regenerate if needed
    const masterPath = path.join('./videos/processed', videoId, 'master.m3u8');

    if (await fs.pathExists(masterPath)) {
      let content = await fs.readFile(masterPath, 'utf8');

      // If the saved master playlist still references S3 keys (e.g. "videos/processed/.."),
      // rewrite those to API stream URLs so the client requests the API endpoint.
      if (content.includes('videos/processed') && video.qualities?.length) {
        for (const q of video.qualities) {
          if (q.playlist) {
            const s3Key = q.playlist as string;
            // Use a relative playlist path so clients resolve it against
            // the master playlist URL (avoids duplicated /stream/ prefixes)
            const apiUrl = `${q.height}p/playlist.m3u8`;
            // replace all occurrences of the S3 key with the relative apiUrl
            content = content.split(s3Key).join(apiUrl);
          }
        }
        // update cached master file with rewritten content (best-effort)
        try {
          await fs.writeFile(masterPath, content, 'utf8');
        } catch (e) {
          /* ignore */
        }
      }

      return content;
    }

    // If not on disk, generate master playlist (references /stream/... URLs)
    const masterPlaylist =
      this.masterPlaylistService.generateMasterPlaylist(video);

    // Save locally for faster subsequent requests (best-effort)
    try {
      await this.masterPlaylistService.saveMasterPlaylist(
        videoId,
        masterPlaylist,
      );
    } catch (e) {
      /* ignore */
    }

    return masterPlaylist;
  }

  async getQualityPlaylist(videoId: string, quality: string): Promise<string> {
    const video = await this.videosService.findById(videoId);
    const qualityInfo = video.qualities?.find(
      (q) => `${q.height}p` === quality,
    );

    if (!qualityInfo) {
      throw new NotFoundException('Quality not available');
    }

    const playlistPath = path.join(
      './videos/processed',
      videoId,
      quality,
      'playlist.m3u8',
    );

    // If we have a local copy, return it
    if (await fs.pathExists(playlistPath)) {
      return fs.readFile(playlistPath, 'utf8');
    }

    // Otherwise, try to pull from MinIO using the stored S3 key in quality.playlist
    // quality.playlist typically contains the S3 key like "videos/processed/<id>/<quality>/playlist.m3u8"
    if (qualityInfo.playlist) {
      const tmpDir = path.join('./videos/temp', videoId, quality);
      await fs.ensureDir(tmpDir);
      const tmpFile = path.join(tmpDir, 'playlist.m3u8');

      try {
        await this.storageService.downloadToFile(qualityInfo.playlist, tmpFile);
        const content = await fs.readFile(tmpFile, 'utf8');
        // optionally cache locally for future
        const destDir = path.dirname(playlistPath);
        await fs.ensureDir(destDir);
        await fs.copyFile(tmpFile, playlistPath);
        return content;
      } catch (e) {
        throw new NotFoundException('Playlist not found');
      }
    }

    throw new NotFoundException('Playlist not found');
  }

  async getSegmentPath(
    videoId: string,
    quality: string,
    seq: number,
  ): Promise<string> {
    const paddedSeq = seq.toString().padStart(3, '0');
    const segmentPath = path.join(
      './videos/processed',
      videoId,
      quality,
      `segment_${paddedSeq}.ts`,
    );

    if (await fs.pathExists(segmentPath)) {
      return segmentPath;
    }

    // If not on disk, try to download from MinIO using expected key
    const s3Key = `videos/processed/${videoId}/${quality}/segment_${paddedSeq}.ts`;
    const tmpDir = path.join('./videos/temp', videoId, quality);
    await fs.ensureDir(tmpDir);
    const tmpFile = path.join(tmpDir, `segment_${paddedSeq}.ts`);

    try {
      await this.storageService.downloadToFile(s3Key, tmpFile);
      // optionally copy into processed folder for efficiency
      const destDir = path.dirname(segmentPath);
      await fs.ensureDir(destDir);
      await fs.copyFile(tmpFile, segmentPath);
      return tmpFile;
    } catch (e) {
      throw new NotFoundException('Segment not found');
    }
  }

  async getAvailableQualities(videoId: string): Promise<string[]> {
    const video = await this.videosService.findById(videoId);
    return video.qualities?.map((q) => `${q.height}p`) || [];
  }
}
