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

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { LogHoursDto } from './dto/log-hours.dto';
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

  // --- Owner-only: manage machinery catalog ---

  @Post()
  @Roles(SystemRole.Owner)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateMachineryDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  @Roles(SystemRole.Owner)
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

  // --- Read: all authorized roles see full list; operators see assigned only ---

  @Get('my')
  @Roles(SystemRole.OperatorDriver)
  findMyMachines(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.findMyMachines(companyId, userId);
  }

  @Get()
  @Roles(SystemRole.Owner, SystemRole.OperatorDriver, SystemRole.ProjectManager)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  // --- Operator assignment (Owner only) ---

  @Post(':id/operators')
  @Roles(SystemRole.Owner)
  assignOperator(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number; isHelper?: boolean },
  ) {
    return this.service.assignOperator(id, body.userId, body.isHelper || false);
  }

  // --- Log hours: allowed for assigned operators + Owner ---

  @Post(':id/log-hours')
  @Roles(SystemRole.Owner, SystemRole.OperatorDriver)
  logHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LogHoursDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.maintenanceService.logHours(id, dto.hours, userId);
  }

  // --- Complete maintenance: Owner, Storekeeper, or assigned Operator can trigger ---

  @Post(':id/complete-maintenance')
  @Roles(SystemRole.Owner, SystemRole.Storekeeper, SystemRole.OperatorDriver)
  completeMaintenance(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.completeMaintenance(id);
  }
}
