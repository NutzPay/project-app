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
    .setTitle('NutzBeta Payment Gateway API')
    .setDescription(`
# NutzBeta Payment Gateway API

API completa para integração com o gateway de pagamentos NutzBeta.

## Autenticação

Esta API utiliza **API Keys** para autenticação. Para usar a API:

1. Gere uma API key através do dashboard
2. Use a API key no header Authorization: \`Bearer <sua_api_key>\`
3. Certifique-se de que sua API key possui os **scopes** necessários

## Scopes Disponíveis

- \`payments:read\` - Ler informações de pagamentos
- \`payments:write\` - Criar novos pagamentos
- \`webhooks:read\` - Ler configurações de webhooks
- \`webhooks:write\` - Configurar webhooks
- \`account:read\` - Ler informações da conta
- \`*\` - Acesso completo (use com cuidado)

## Rate Limiting

- **10 requests por segundo** (burst)
- **300 requests por minuto**
- **1000 requests por hora**
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Insira sua API key (formato: ntz_test_xxx ou ntz_live_xxx)',
      },
      'ApiKeyAuth',
    )
    .addTag('API Keys', 'Gerenciamento de chaves de API para integração')
    .addTag('Payments', '💳 Processamento de pagamentos - Core da API')
    .addTag('Webhooks', '🔔 Notificações em tempo real')
    .addTag('Authentication', '🔐 Autenticação e autorização')
    .addTag('Companies', '🏢 Gerenciamento de empresas')
    .addTag('Users', '👤 Gerenciamento de usuários')
    .addTag('Transactions', '💸 Histórico de transações')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'NutzBeta Payment Gateway API',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title {
        color: #4F46E5;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 20px;
      }
      .swagger-ui .info .description {
        font-size: 1.1rem;
        line-height: 1.6;
      }
      .swagger-ui .opblock .opblock-summary-description {
        font-weight: 600;
      }
      .swagger-ui .opblock.opblock-post {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.03);
      }
      .swagger-ui .opblock.opblock-get {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.03);
      }
      .swagger-ui .opblock.opblock-delete {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.03);
      }
      .swagger-ui .scheme-container {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        border-left: 4px solid #4F46E5;
      }
      .swagger-ui .auth-wrapper {
        padding: 20px;
        background: #fef3c7;
        border-radius: 8px;
        margin: 15px 0;
      }
      .swagger-ui .auth-container .auth-btn-wrapper {
        text-align: center;
        margin-top: 15px;
      }
      .swagger-ui .btn.authorize {
        background: #4F46E5;
        border-color: #4F46E5;
        font-weight: 600;
        padding: 8px 20px;
      }
      .swagger-ui .btn.authorize:hover {
        background: #3730a3;
      }
      .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3 {
        color: #1f2937;
      }
      .swagger-ui .opblock-tag {
        font-size: 1.25rem;
        font-weight: 700;
        color: #374151;
        margin: 30px 0 15px 0;
      }
      .swagger-ui .parameter__name {
        font-weight: 600;
      }
      .swagger-ui .response-col_status {
        font-weight: 600;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      requestSnippets: {
        generators: {
          "curl_bash": {
            "title": "cURL (bash)",
            "syntax": "bash"
          },
          "curl_powershell": {
            "title": "cURL (PowerShell)",
            "syntax": "powershell"
          },
          "curl_cmd": {
            "title": "cURL (CMD)",
            "syntax": "bash"
          }
        },
        defaultExpanded: false,
        languages: null
      }
    }
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