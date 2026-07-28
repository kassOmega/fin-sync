import { Module } from '@nestjs/common';
import { StoreItemsController } from './store-items.controller';
import { StoreItemsService } from './store-items.service';
import { StoreRequestsController } from './store-requests.controller';
import { StoreWorkflowService } from './store-workflow.service';

@Module({
  controllers: [StoreItemsController, StoreRequestsController],
  providers: [StoreItemsService, StoreWorkflowService],
})
export class StoreItemsModule {}
