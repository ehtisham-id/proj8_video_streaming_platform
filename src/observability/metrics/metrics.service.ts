import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  public register = client.register;

  public httpRequestsTotal: client.Counter<string>;
  public activeStreams: client.Gauge<string>;
  public streamingBandwidthBytes: client.Gauge<string>;

  constructor() {
    // Collect default Node.js/process metrics
    try {
      client.collectDefaultMetrics();
    } catch (err) {
      // collectDefaultMetrics may only be called once across an application
    }

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    this.activeStreams = new client.Gauge({
      name: 'active_streams',
      help: 'Number of active streaming connections',
    });

    this.streamingBandwidthBytes = new client.Gauge({
      name: 'streaming_bandwidth_bytes',
      help: 'Streaming bandwidth in bytes',
      labelNames: ['route'],
    });
  }

  incHttpRequests(labels?: Record<string, string>, value = 1) {
    this.httpRequestsTotal.inc(labels || {}, value);
  }

  setActiveStreams(value: number) {
    this.activeStreams.set(value);
  }

  incActiveStreams(amount = 1) {
    this.activeStreams.inc(amount);
  }

  decActiveStreams(amount = 1) {
    this.activeStreams.dec(amount);
  }

  setStreamingBandwidth(bytes: number, labels?: Record<string, string>) {
    this.streamingBandwidthBytes.set(labels || {}, bytes);
  }

  async metrics() {
    return this.register.metrics();
  }

  getActiveStreamsValue(): number {
    try {
      const m = this.activeStreams.get();
      const v = (m as any)?.values?.[0]?.value;
      return typeof v === 'number' ? v : Number(v) || 0;
    } catch {
      return 0;
    }
  }

  getTotalHttpRequests(): number {
    try {
      const m = this.httpRequestsTotal.get();
      const values = (m as any)?.values || [];
      return values.reduce(
        (acc: number, cur: any) => acc + (Number(cur.value) || 0),
        0,
      );
    } catch {
      return 0;
    }
  }

  getStreamingBandwidthValue(): number {
    try {
      const m = this.streamingBandwidthBytes.get();
      const values = (m as any)?.values || [];
      return values.reduce(
        (acc: number, cur: any) => acc + (Number(cur.value) || 0),
        0,
      );
    } catch {
      return 0;
    }
  }
}
