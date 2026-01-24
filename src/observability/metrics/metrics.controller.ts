import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async getMetrics() {
    return this.metrics.metrics();
  }

  @Get('streaming')
  @ApiOperation({ summary: 'Streaming-specific metrics' })
  async getStreamingMetrics() {
    return {
      total_requests: this.metrics.getTotalHttpRequests(),
      streaming_bandwidth: this.metrics.getStreamingBandwidthValue(),
      active_streams: this.metrics.getActiveStreamsValue(),
    };
  }
}
