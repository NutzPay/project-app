import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import * as fs from 'fs';
import * as path from 'path';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'offers');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads/offers',
    }),
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}