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
  FileTypeValidator 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/video.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { StorageService } from '../storage/storage.service';
import Multer from 'multer';

@ApiTags('videos')
@Controller('videos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VideosController {
  constructor(
    private videosService: VideosService,
    private storageService: StorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('video', {
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files allowed'), false);
      }
    },
  }))
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
    // Save to MinIO
    const fileKey = await this.storageService.saveVideo(file, req.user._id);
    
    // Create video record
    const video = await this.videosService.create(
      req.user._id,
      body.title,
      fileKey,
    );
    
    return { 
      videoId: (video as any)._id, 
      status: 'uploaded',
      minioKey: fileKey,
      url: await this.storageService.getVideoUrl(fileKey),
    };
  }

  @Get()
  async findAll() {
    const videos = await this.videosService.findAll();
    return Promise.all(videos.map(async (video) => ({
      id: (video as any)._id,
      title: video.title,
      status: video.status,
      url: await this.storageService.getVideoUrl(video.filename),
      createdAt: (video as any).createdAt,
    })));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const video = await this.videosService.findById(id);
    return {
      ...video,
      url: await this.storageService.getVideoUrl(video.filename),
      playable: video.status === 'ready',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.videosService.delete(id, req.user._id);
    return { message: 'Video deleted from MinIO' };
  }
}
