import { Module } from '@nestjs/common';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    IoRedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
  ],
  controllers: [RedisController],
  providers: [RedisService]
})
export class RedisModule {}
