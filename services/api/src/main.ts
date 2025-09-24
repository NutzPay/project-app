import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import helmet from 'helmet';
import * as session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

import { AppModule } from './app.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const redisUrl = configService.get('REDIS_URL');
  const sessionSecret = configService.get('SESSION_SECRET');
  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:3000'];

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Redis session store - with error handling
  let redisClient;
  try {
    redisClient = createClient({ 
      url: redisUrl || 'redis://localhost:6379',
      legacyMode: true 
    });
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.warn('⚠️  Redis connection failed, using memory store:', error.message);
    redisClient = null;
  }

  app.use(
    session({
      store: redisClient ? new RedisStore({ client: redisClient }) : undefined,
      secret: sessionSecret || 'fallback-secret-for-dev',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
      },
    }),
  );

  // Global middleware and filters
  app.use(RequestIdMiddleware);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Static files for uploaded images
  const express = require('express');
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // API versioning
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NutzBeta API')
    .setDescription('Gateway de pagamentos com recursos de segurança avançados')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Use o formato: NutzKey <sua_api_key>',
      },
      'apikey',
    )
    .addTag('Authentication', 'Autenticação e autorização')
    .addTag('API Keys', 'Gerenciamento de chaves de API')
    .addTag('Webhooks', 'Gerenciamento de webhooks')
    .addTag('Companies', 'Gerenciamento de empresas')
    .addTag('Users', 'Gerenciamento de usuários')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'NutzBeta API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #4F46E5 }
    `,
  });

  // Health check
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);
  
  console.log(`🚀 NutzBeta API running on http://localhost:${port}`);
  console.log(`📖 Documentation available at http://localhost:${port}/docs`);
  console.log(`❤️  Health check at http://localhost:${port}/health`);
}

bootstrap();