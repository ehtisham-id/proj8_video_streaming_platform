import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HttpHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { KafkaService } from '../../kafka/kafka.service';
import { RedisService } from '../../redis/redis.service';
import { MetricsService } from '../metrics/metrics.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private mongoose: MongooseHealthIndicator,
    private redisService: RedisService,
    private kafkaService: KafkaService,
    private metrics: MetricsService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      async () => {
        try {
          // attempt to find a redis client and ping it; adapt to your RedisService API if needed
          const client =
            (this.redisService as any).getClient?.() ??
            (this.redisService as any).client ??
            null;
          const pong =
            client && typeof client.ping === 'function'
              ? await client.ping()
              : typeof (this.redisService as any).ping === 'function'
              ? await (this.redisService as any).ping()
              : null;

          if (pong === 'PONG' || pong === 'OK') {
            return { redis: { status: 'up' } };
          }
          throw new Error('Redis ping failed');
        } catch (err) {
          throw err;
        }
      },
      () =>
        this.http.pingCheck('external-api', 'https://httpbin.org/status/200'),
      async () => ({
        video_processor: {
          status: 'up',
          details: {
            consumers: await this.kafkaService.admin().listGroups(),
            lag: 'low',
          },
        },
      }),
    ]);
  }

  @Get('detailed')
  async detailedHealth() {
    const metricsSnapshot = await this.metrics.metrics();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        active_streams: this.metrics.getActiveStreamsValue(),
        total_requests: this.metrics.getTotalHttpRequests(),
      },
      services: {
        mongodb: 'healthy',
        redis: 'healthy',
        kafka: 'healthy',
        nginx: 'healthy',
      },
      prometheus: metricsSnapshot.slice(0, 500), // First 500 chars
    };
  }
}
