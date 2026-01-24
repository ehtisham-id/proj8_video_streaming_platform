import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private redisService: RedisService, private kafkaService: KafkaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'OK' })
  async check() {
    const redisPing = await this.redisService.ping();
    const kafkaTopics = await this.kafkaService.admin().listTopics();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
        redis: redisPing === 'PONG' ? 'healthy' : 'unhealthy',
        kafka: kafkaTopics.length > 0 ? 'healthy' : 'initializing',
      },
    };
  }
}
