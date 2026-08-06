import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectStoresController } from './project-stores.controller';
import { StoreTransfersController } from './store-transfers.controller';
import { StoreTransfersService } from './store-transfers.service';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    StoresController,
    ProjectStoresController,
    StoreTransfersController,
  ],
  providers: [StoresService, StoreTransfersService],
  exports: [StoresService, StoreTransfersService],
})
export class StoresModule {}
