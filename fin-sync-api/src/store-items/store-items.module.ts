import { Module } from '@nestjs/common';
import { StoreItemsController } from './store-items.controller';
import { StoreItemsService } from './store-items.service';
import { StoreWorkflowService } from './store-workflow.service';

@Module({
  controllers: [StoreItemsController],
  providers: [StoreItemsService, StoreWorkflowService],
})
export class StoreItemsModule {}
