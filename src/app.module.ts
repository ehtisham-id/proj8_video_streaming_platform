import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { KafkaModule } from './kafka/kafka.module';
import { VideosModule } from './videos/videos.module';
import { ProcessingModule } from './processing/processing.module';
import { StreamingModule } from './streaming/streaming.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EmailsModule } from './emails/emails.module';
import { ObservabilityModule } from './observability/observability.module';
import { MiddlewareConsumer } from '@nestjs/common';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    RedisModule,
    StorageModule,
    KafkaModule,
    ProcessingModule,
    VideosModule,
    StreamingModule,
    SubscriptionsModule,
    EmailsModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [MetricsMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
