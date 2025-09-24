import { Module } from '@nestjs/common';
import { XGateWebhookController } from './xgate-webhook.controller';

@Module({
  controllers: [XGateWebhookController],
})
export class XGateModule {}