import { Module } from '@nestjs/common';
import { TransactionTimeoutService } from './transaction-timeout.service';
import { TransactionsController } from './transactions.controller';
import { UserTransactionsController } from './user-transactions.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [TransactionTimeoutService],
  controllers: [TransactionsController, UserTransactionsController],
  exports: [TransactionTimeoutService],
})
export class TransactionsModule {}