import { Controller, Get } from '@nestjs/common';
//import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

//@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
 // @ApiOperation({ summary: 'Health check endpoint' })
  //@ApiResponse({ status: 200, description: 'OK' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
        redis: 'not-configured-yet',
        kafka: 'not-configured-yet',
      },
    };
  }
}
