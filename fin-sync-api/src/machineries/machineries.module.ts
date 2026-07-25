import { Module } from '@nestjs/common';
import { MachineriesController } from './machineries.controller';
import { MachineriesService } from './machineries.service';
import { MaintenanceService } from './maintenance.service';

@Module({
  controllers: [MachineriesController],
  providers: [MachineriesService, MaintenanceService],
})
export class MachineriesModule {}
