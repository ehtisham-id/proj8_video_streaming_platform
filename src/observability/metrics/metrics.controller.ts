import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async metricsEndpoint() {
    return this.metrics.metrics();
  }

  @Get('streaming')
  @ApiOperation({ summary: 'Streaming-specific metrics' })
  streamingMetrics() {
    return {
      total_requests: this.metrics.getTotalHttpRequests(),
      active_streams: this.metrics.getActiveStreamsValue(),
      streaming_bandwidth: this.metrics.getStreamingBandwidthValue(),
    };
  }
}
