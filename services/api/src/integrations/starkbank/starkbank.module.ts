import { Module } from '@nestjs/common';
import { StarkBankService } from './starkbank.service';
import { StarkBankController } from './starkbank.controller';
import { StarkBankWebhookController } from './starkbank-webhook.controller';

@Module({
  providers: [StarkBankService],
  controllers: [StarkBankController, StarkBankWebhookController],
  exports: [StarkBankService],
})
export class StarkBankModule {}