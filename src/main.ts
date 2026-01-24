import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ExceptionFilter } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/exceptions.filter';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Global validation
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  // File upload limits
  app.use(
    '/videos',
    express.static('videos', {
      maxAge: '1d',
      etag: false,
    }),
  );

  // CORS
  app.enableCors({
    origin:
      configService.get<string>('ALLOWED_ORIGINS')?.split(',') ||
      'http://localhost:3000',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Video Streaming Platform')
    .setDescription('Production-ready Netflix-like backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(configService.get<number>('PORT') || 3000);
  console.log(
    `🚀 Application running on: http://localhost:${configService.get<number>('NGINX_PORT') || 80}/api`,
  );
}
bootstrap();
