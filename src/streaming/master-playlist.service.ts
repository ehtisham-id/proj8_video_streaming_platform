import { Injectable } from '@nestjs/common';
import fs from 'fs-extra';
import path from 'path';
import { Video } from '../videos/schemas/video.schema';

@Injectable()
export class MasterPlaylistService {
  generateMasterPlaylist(video: Video): string {
    let m3u8 = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MEDIA-SEQUENCE:0`;

    // Build master playlist with relative quality playlist paths so
    // the client resolves them against the master playlist location.
    video.qualities.forEach((quality) => {
      const playlistUrl = `${quality.height}p/playlist.m3u8`;
      m3u8 += `
#EXT-X-STREAM-INF:BANDWIDTH=${String(quality.bitrate).replace('k', '000')},RESOLUTION=${quality.height}p
${playlistUrl}`;
    });

    m3u8 += '\n#EXT-X-ENDLIST';
    return m3u8;
  }

  async saveMasterPlaylist(videoId: string, content: string): Promise<void> {
    const filePath = `./videos/processed/${videoId}/master.m3u8`;
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content);
  }
}
