import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { DailyLaborersService } from './daily-laboreers.service';

@Controller('companies/:companyId/daily-laboreers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DailyLaborersController {
  constructor(private readonly service: DailyLaborersService) {}

  // ─── Registry ──────────────────────────────────────────────

  @Post()
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: {
      laborerCode: string;
      firstName: string;
      lastName: string;
      phone?: string;
      dailyRate: number;
    },
  ) {
    return this.service.create(companyId, dto);
  }

  @Get()
  @RequirePermissions(PermissionCode.EMPLOYEES_READ)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  update(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      laborerCode?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      dailyRate?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.update(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  remove(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(companyId, id);
  }

  // ─── Exclusive Timesheet / Attendance ──────────────────────

  @Post('timesheets')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  createTimesheet(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: {
      laborerId: number;
      date: string;
      hours?: number;
      breakDay?: boolean;
      note?: string;
    },
  ) {
    return this.service.createTimesheet(companyId, dto);
  }

  @Get('timesheets')
  @RequirePermissions(PermissionCode.EMPLOYEES_READ)
  listTimesheets(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.listTimesheets(companyId, startDate, endDate);
  }

  @Get(':id/timesheets')
  @RequirePermissions(PermissionCode.EMPLOYEES_READ)
  timesheetsByLaborer(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getTimesheetsByLaborer(companyId, id);
  }

  // ─── Period Payroll Run ────────────────────────────────────

  @Post('payroll/generate')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  generatePeriodPayroll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      return { error: 'startDate and endDate query params are required' };
    }
    return this.service.generatePeriodPayroll(companyId, startDate, endDate);
  }
}
