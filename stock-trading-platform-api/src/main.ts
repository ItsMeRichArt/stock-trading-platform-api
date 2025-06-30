import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable CORS for development
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  logger.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
