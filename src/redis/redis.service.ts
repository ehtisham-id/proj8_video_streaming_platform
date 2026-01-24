import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(private readonly redis: Redis) {}

  async blacklistToken(jti: string, expiry: number): Promise<void> {
    await this.redis.set(`blacklist:${jti}`, '1', 'EX', expiry);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const exists = await this.redis.get(`blacklist:${jti}`);
    return !!exists;
  }

  async setRateLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<boolean> {
    const current = await this.redis.get(key);
    if (parseInt(current || '0') >= limit) return false;

    await this.redis.incr(key);
    await this.redis.expire(key, window);
    return true;
  }

  async ping(): Promise<string> {
    return this.redis.ping();
  }
}
