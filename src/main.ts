import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security
  app.use(helmet());
  
  // Global validation
  app.useGlobalPipes(new CustomValidationPipe());
  
  // CORS
  app.enableCors({
    origin: //process.env.ALLOWED_ORIGINS?.split(',') || 
      
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

  await app.listen( 3000);
  console.log(`🚀 Application running on: http://localhost:${3000 }/api`);
}
bootstrap();
