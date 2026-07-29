import { Module } from '@nestjs/common';
import { ProjectPurchasesController } from './project-purchases.controller';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  controllers: [PurchasesController, ProjectPurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
