import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { LoggingService } from './logging/logging.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, MetricsController],
  providers: [LoggingService, MetricsService],
  exports: [LoggingService, MetricsService],
})
export class ObservabilityModule {}
