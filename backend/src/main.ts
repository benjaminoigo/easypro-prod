import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';
import { ensureDir, getUploadRoot } from './common/uploads/upload-path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS - support multiple origins for Render deployment
  const corsOrigins = configService.get<string>('CORS_ORIGIN', 'http://localhost:3002');
  app.enableCors({
    origin: corsOrigins.split(',').map(origin => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve static files from uploads folder
  const uploadRoot = getUploadRoot(configService.get<string>('UPLOAD_DEST', './uploads'));
  ensureDir(uploadRoot);
  app.useStaticAssets(uploadRoot, {
    prefix: '/api/uploads/',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Trust proxy for Render (needed for correct IP detection)
  app.set('trust proxy', 1);

  // Run seed on startup (idempotent - safe to run multiple times)
  try {
    const seedService = app.get(SeedService);
    await seedService.seedAdmin();
    logger.log('✅ Database seeding completed');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on port ${port}`);
}
bootstrap();
