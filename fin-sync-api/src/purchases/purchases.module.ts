import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { ProjectPurchasesController } from './project-purchases.controller';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [LedgerModule],
  controllers: [PurchasesController, ProjectPurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
