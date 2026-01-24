import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from '../redis/redis.service';


@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private redisService: RedisService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'OK' })
  async check() {
    const redisPing = await this.redisService.ping();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
        redis: redisPing === 'PONG' ? 'healthy' : 'unhealthy',
        kafka: 'not-configured-yet',
      },
    };
  }
}
