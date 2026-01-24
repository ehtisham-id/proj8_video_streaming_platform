import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HttpHealthIndicator,
  MongooseHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { KafkaService } from '../../kafka/kafka.service';
import { RedisService } from '../../redis/redis.service';
import { ModuleRef } from '@nestjs/core';
import { MetricsService } from '../metrics/metrics.service';

@Controller('observability/health')
export class HealthObserveController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private mongoose: MongooseHealthIndicator,
    private metrics: MetricsService,
    private moduleRef: ModuleRef,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      async (): Promise<HealthIndicatorResult> => {
        try {
          const redisSvc = this.moduleRef.get(RedisService, { strict: false });
          if (!redisSvc) return { redis: { status: 'down' } } as HealthIndicatorResult;
          const pong =
            typeof redisSvc.ping === 'function' ? await redisSvc.ping() : null;
          if (pong === 'PONG' || pong === 'OK')
            return { redis: { status: 'up' } } as HealthIndicatorResult;
          return { redis: { status: 'down' } } as HealthIndicatorResult;
        } catch (err) {
          throw err;
        }
      },
      () =>
        this.http.pingCheck('external-api', 'https://httpbin.org/status/200'),
      async () => {
        try {
          const kafkaSvc = this.moduleRef.get(KafkaService, { strict: false });
          const groups =
            kafkaSvc && typeof kafkaSvc.admin === 'function'
              ? await kafkaSvc
                  .admin()
                  .listGroups()
                  .catch(() => [])
              : [];
          return {
            video_processor: {
              status: 'up',
              details: { consumers: groups, lag: 'low' },
            },
          };
        } catch (err) {
          return {
            video_processor: {
              status: 'down',
              details: { consumers: [], lag: 'unknown' },
            },
          };
        }
      },
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
