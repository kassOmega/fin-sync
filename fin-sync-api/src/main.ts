import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
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
