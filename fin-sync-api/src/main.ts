async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse allowed origins from environment variable
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : [];

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://fin-sync-mu.vercel.app', // Explicit fallback
  ];

  const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server or non-browser requests (Postman/curl)
      if (!origin) return callback(null, true);

      // Sanitize trailing slashes for clean comparison
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed.replace(/\/$/, '') === normalizedOrigin,
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        // DO NOT pass an Error object here—pass false so CORS safely rejects without 500 throwing
        callback(null, false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
