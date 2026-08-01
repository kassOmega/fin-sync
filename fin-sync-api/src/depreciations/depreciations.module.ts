import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DepreciationsController } from './depreciations.controller';
import { DepreciationsService } from './depreciations.service';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [DepreciationsController],
  providers: [DepreciationsService],
})
export class DepreciationsModule {}
