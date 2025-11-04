import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { StarkBankModule } from './integrations/starkbank/starkbank.module';
import { StarkbankModule } from './starkbank/starkbank.module';
import { XGateModule } from './integrations/xgate/xgate.module';
import { TransactionsModule } from './transactions/transactions.module';
import { OffersModule } from './offers/offers.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksDocsModule } from './webhooks-docs/webhooks-docs.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: 10, // 10 requests per second
        },
        {
          name: 'medium',
          ttl: 60000, // 1 minute
          limit: parseInt(configService.get('RATE_LIMIT_MAX_REQUESTS', '300')),
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hour
          limit: 1000, // 1000 requests per hour
        },
      ],
      inject: [ConfigService],
    }),

    // Job queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: new URL(configService.get('REDIS_URL', 'redis://localhost:6379')).hostname,
          port: parseInt(new URL(configService.get('REDIS_URL', 'redis://localhost:6379')).port),
        },
      }),
      inject: [ConfigService],
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Application modules
    PrismaModule,
    AuthModule,
    ApiKeysModule,
    WebhooksModule,
    CompaniesModule,
    UsersModule,
    AuditModule,
    StarkBankModule,
    StarkbankModule,
    XGateModule,
    TransactionsModule,
    OffersModule,
    PaymentsModule,
    WebhooksDocsModule,
    HealthModule,
  ],
})
export class AppModule {}