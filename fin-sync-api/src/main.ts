import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((allowedOrigin) => {
        return origin.replace(/\/$/, '') === allowedOrigin.replace(/\/$/, '');
      });

      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
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
