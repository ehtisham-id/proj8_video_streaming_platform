import { Controller, Get, Param, Res, Req, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import { StreamingService } from './streaming.service';
import { VideosService } from '../videos/videos.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('streaming')
@Controller('stream')
export class StreamingController {
  constructor(
    private streamingService: StreamingService,
    private videosService: VideosService,
  ) {}

  @Get(':videoId/master.m3u8')
  @ApiOperation({ summary: 'Get HLS master playlist' })
  async getMasterPlaylist(
    @Param('videoId') videoId: string,
    @Res() res: Response,
  ) {
    const video = await this.videosService.findById(videoId);
    if (video.status !== 'ready') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        error: 'Video not processed yet',
      });
      return;
    }

    const playlist = await this.streamingService.getMasterPlaylist(videoId);
    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.send(playlist);
  }

  @Get(':videoId/:quality/playlist.m3u8')
  @ApiOperation({ summary: 'Get quality-specific playlist' })
  async getQualityPlaylist(
    @Param('videoId') videoId: string,
    @Param('quality') quality: string,
    @Res() res: Response,
  ) {
    const playlist = await this.streamingService.getQualityPlaylist(
      videoId,
      quality,
    );
    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.send(playlist);
  }

  @Get(':videoId/:quality/segment/:seq.ts')
  @ApiOperation({ summary: 'Get video segment with range support' })
  async getSegment(
    @Param('videoId') videoId: string,
    @Param('quality') quality: string,
    @Param('seq') seq: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const video = await this.videosService.findById(videoId);
    if (
      !video.qualities?.find(
        (q) =>
          q.playlist === quality ||
          String(q.height) === quality ||
          String(q.bitrate) === quality,
      )
    ) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'Quality not found' });
      return;
    }

    const segmentPath = await this.streamingService.getSegmentPath(
      videoId,
      quality,
      parseInt(seq),
    );
    res.set({
      'Content-Type': 'video/mp2t',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    });

    // Handle range requests
    const stat = require('fs').statSync(segmentPath);
    const fileSize = stat.size;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': end - start + 1,
      });

      require('fs').createReadStream(segmentPath, { start, end }).pipe(res);
    } else {
      res.sendFile(path.resolve(segmentPath));
    }
  }

  // Legacy/alternate segment filename route support:
  // Some HLS playlists reference segment files as `segment_000.ts` (no
  // additional `segment/` path). Accept those requests and map them to
  // the same handler by extracting the numeric sequence from the filename.
  @Get(':videoId/:quality/:segmentFile')
  @ApiOperation({ summary: 'Get video segment by filename (legacy)' })
  async getSegmentByFilename(
    @Param('videoId') videoId: string,
    @Param('quality') quality: string,
    @Param('segmentFile') segmentFile: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Only handle .ts requests here; otherwise let other routes win.
    if (!segmentFile || !segmentFile.endsWith('.ts')) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'Segment not found' });
      return;
    }

    // Try to extract a numeric sequence from filenames like:
    // - segment_000.ts
    // - segment-000.ts
    // - 000.ts
    const match =
      segmentFile.match(/(?:segment[_-]?)(\d+)\.ts$/) ||
      segmentFile.match(/(\d+)\.ts$/);
    if (!match) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'Segment not found' });
      return;
    }

    const seqNum = parseInt(match[1], 10);
    if (Number.isNaN(seqNum)) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'Segment not found' });
      return;
    }

    const segmentPath = await this.streamingService.getSegmentPath(
      videoId,
      quality,
      seqNum,
    );

    res.set({
      'Content-Type': 'video/mp2t',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    });

    const stat = require('fs').statSync(segmentPath);
    const fileSize = stat.size;

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': end - start + 1,
      });

      require('fs').createReadStream(segmentPath, { start, end }).pipe(res);
    } else {
      res.sendFile(path.resolve(segmentPath));
    }
  }
}
