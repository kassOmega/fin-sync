import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DailyLaborersController } from './daily-laboreers.controller';
import { DailyLaborersService } from './daily-laboreers.service';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [DailyLaborersController],
  providers: [DailyLaborersService],
  exports: [DailyLaborersService],
})
export class DailyLaborersModule {}
