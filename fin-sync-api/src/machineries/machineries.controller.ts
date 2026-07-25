import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';
import { MachineriesService } from './machineries.service';
import { MaintenanceService } from './maintenance.service';

@Controller('companies/:companyId/machineries')
@UseGuards(RolesGuard)
export class MachineriesController {
  constructor(
    private readonly service: MachineriesService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @Post()
  @Roles(SystemRole.Owner)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateMachineryDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Get()
  @Roles(SystemRole.Owner, SystemRole.OperatorDriver, SystemRole.ProjectManager)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @Roles(SystemRole.Owner, SystemRole.OperatorDriver)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMachineryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.Owner)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/operators')
  @Roles(SystemRole.Owner)
  assignOperator(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number; isHelper?: boolean },
  ) {
    return this.service.assignOperator(id, body.userId, body.isHelper || false);
  }

  @Post(':id/log-hours')
  @Roles(SystemRole.Owner, SystemRole.OperatorDriver)
  logHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { hours: number },
  ) {
    return this.maintenanceService.logHours(id, body.hours);
  }

  @Post(':id/complete-maintenance')
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
  completeMaintenance(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.completeMaintenance(id);
  }
}
