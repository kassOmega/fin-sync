import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Add this global pipe to automatically transform types
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically converts strings to numbers/dates based on DTO
      whitelist: true, // Strips away unknown properties
    }),
  );

  await app.listen(3000);
}
bootstrap();
