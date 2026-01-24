import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/video.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { Express } from 'express';
import Multer from 'multer';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly storageService: StorageService,
  ) {}

  // ============================
  // Upload video (MinIO)
  // ============================
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Only video files allowed'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async uploadVideo(
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'video/*' }),
        ],
      }),
    )
    file: Multer.File,
    @Body() body: CreateVideoDto,
  ) {
    // Save original video to MinIO
    const minioKey = await this.storageService.saveVideo(
      file,
      req.user._id,
    );

    // Create DB record
    const video = await this.videosService.create(
      req.user._id,
      body.title,
      minioKey,
    );

    return {
      videoId: (video as any)._id,
      status: 'uploaded',
      minioKey,
      url: await this.storageService.getVideoUrl(minioKey),
    };
  }

  // ============================
  // List all videos (lightweight)
  // ============================
  @Get()
  async findAll() {
    const videos = await this.videosService.findAll();

    return videos.map(video => ({
      id: (video as any)._id,
      title: video.title,
      status: video.status,
      duration: video.duration,
      createdAt: (video as any).createdAt,
    }));
  }

  // ============================
  // Get single video
  // ============================
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const video = await this.videosService.findById(id);
    const url = await this.storageService.getVideoUrl(video.filename);

    // handle both Mongoose Document (with toObject) and plain object
    const videoObj = (video as any)?.toObject ? (video as any).toObject() : (video as any);

    return {
      ...videoObj,
      url,
      playable: video.status === 'ready',
    };
  }

  // ============================
  // Delete video
  // ============================
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.videosService.delete(id, req.user._id);
    return { message: 'Video deleted from MinIO' };
  }
}
