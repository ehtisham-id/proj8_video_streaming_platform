import { Module, Global } from '@nestjs/common';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule], // Import ConfigModule
  controllers: [RedisController],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST') || 'redis', 
          port: parseInt(configService.get<string>('REDIS_PORT') ?? '6379', 10),
        });
      },
    },
    {
      provide: RedisService,
      useFactory: (redisClient: Redis) => new RedisService(redisClient),
      inject: [REDIS_CLIENT],
    },
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
