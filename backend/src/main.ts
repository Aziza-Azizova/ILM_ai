import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — enforces all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — allow frontend origin
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Ilm AI backend running on http://localhost:${port}/api`);
}
bootstrap();
