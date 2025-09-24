import { Module } from '@nestjs/common';
import { StarkbankConfigService } from './starkbank-config.service';
import { StarkbankConfigController } from './starkbank-config.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StarkbankConfigController],
  providers: [StarkbankConfigService],
  exports: [StarkbankConfigService],
})
export class StarkbankModule {}