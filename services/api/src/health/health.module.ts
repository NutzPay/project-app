import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [HealthController],
})
export class HealthModule {}