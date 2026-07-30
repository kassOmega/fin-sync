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

import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { LogHoursDto } from './dto/log-hours.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';
import { MachineriesService } from './machineries.service';
import { MaintenanceService } from './maintenance.service';

@Controller('companies/:companyId/machineries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MachineriesController {
  constructor(
    private readonly service: MachineriesService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  // --- Manage machinery catalog ---

  @Post()
  @RequirePermissions(PermissionCode.MACHINERY_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateMachineryDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.MACHINERY_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMachineryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.MACHINERY_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // --- Read: all authorized roles see full list; operators see assigned only ---

  @Get('my')
  findMyMachines(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.findMyMachines(companyId, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.MACHINERY_READ)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  // --- Operator assignment ---

  @Post(':id/operators')
  @RequirePermissions(PermissionCode.MACHINERY_OPERATE)
  assignOperator(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number },
  ) {
    return this.service.assignOperator(id, body.userId);
  }

  @Delete(':id/operators')
  @RequirePermissions(PermissionCode.MACHINERY_OPERATE)
  unassignOperator(@Param('id', ParseIntPipe) id: number) {
    return this.service.unassignOperator(id);
  }

  // --- Log hours: allowed for assigned operators + Owner ---

  @Post(':id/log-hours')
  @RequirePermissions(PermissionCode.MACHINERY_OPERATE)
  logHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LogHoursDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.maintenanceService.logHours(id, dto.hours, userId);
  }

  // --- Complete maintenance ---

  @Post(':id/complete-maintenance')
  @RequirePermissions(PermissionCode.MACHINERY_MAINTAIN)
  completeMaintenance(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.completeMaintenance(id);
  }
}
