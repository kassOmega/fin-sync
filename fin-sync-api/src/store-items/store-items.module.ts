import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectStoreController } from './project-store.controller';
import { StoreItemsController } from './store-items.controller';
import { StoreItemsService } from './store-items.service';
import { StoreRequestsController } from './store-requests.controller';
import { StoreWorkflowService } from './store-workflow.service';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [
    StoreItemsController,
    StoreRequestsController,
    ProjectStoreController,
  ],
  providers: [StoreItemsService, StoreWorkflowService],
})
export class StoreItemsModule {}
