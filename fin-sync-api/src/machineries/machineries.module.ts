import { Module } from '@nestjs/common';
import { MachineriesController } from './machineries.controller';
import { MachineriesService } from './machineries.service';
import { MaintenanceService } from './maintenance.service';
import { ProjectMachineriesController } from './project-machineries.controller';

@Module({
  controllers: [MachineriesController, ProjectMachineriesController],
  providers: [MachineriesService, MaintenanceService],
})
export class MachineriesModule {}
