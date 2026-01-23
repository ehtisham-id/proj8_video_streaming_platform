import { Controller, Get } from '@nestjs/common';
//import { ApiTags } from '@nestjs/swagger';

//@ApiTags('meta')
@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Video Streaming Platform API 🚀';
  }
}
