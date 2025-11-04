import { Module } from '@nestjs/common';
import { WebhooksDocsController } from './webhooks-docs.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [WebhooksDocsController],
})
export class WebhooksDocsModule {}