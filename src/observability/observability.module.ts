import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { KafkaModule } from '../kafka/kafka.module';
import { RedisModule } from '../redis/redis.module';
import { HealthObserveController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { LoggingService } from './logging/logging.service';

@Module({
  imports: [
    TerminusModule,
    KafkaModule,
    RedisModule,
  ],
  controllers: [
    HealthObserveController,
    MetricsController,
  ],
  providers: [
    LoggingService,
    MetricsService,
  ],
  exports: [
    LoggingService,
    MetricsService,
  ],
})
export class ObservabilityModule {}
