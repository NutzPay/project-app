import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}