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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { OvertimeService } from './overtime.service';

@Controller('companies/:companyId/overtime')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OvertimeController {
  constructor(private readonly service: OvertimeService) {}

  // ─── Rates ────────────────────────────────────────────────

  @Get('rates')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getRates(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getRates(companyId);
  }

  @Post('rates')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createRate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: { name: string; multiplier: number },
  ) {
    return this.service.createRate(companyId, dto);
  }

  @Patch('rates/:rateId')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  updateRate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('rateId', ParseIntPipe) rateId: number,
    @Body() dto: { name?: string; multiplier?: number; isActive?: boolean },
  ) {
    return this.service.updateRate(companyId, rateId, dto);
  }

  @Delete('rates/:rateId')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deleteRate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('rateId', ParseIntPipe) rateId: number,
  ) {
    return this.service.deleteRate(companyId, rateId);
  }

  // ─── Entries ──────────────────────────────────────────────

  @Get('entries')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getEntries(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getEntries(companyId, {
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      status,
      startDate,
      endDate,
    });
  }

  @Post('entries')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createEntry(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('id') userId: number,
    @Body()
    dto: {
      employeeId: number;
      date: string;
      hours: number;
      overtimeRateId?: number;
      hourlyRate?: number;
      multiplier?: number;
      reason?: string;
    },
  ) {
    return this.service.createEntry(companyId, dto, userId);
  }

  @Patch('entries/:entryId/approve')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  approveEntry(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.service.approveEntry(companyId, entryId);
  }

  @Patch('entries/:entryId/reject')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  rejectEntry(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.service.rejectEntry(companyId, entryId);
  }

  @Delete('entries/:entryId')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deleteEntry(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.service.deleteEntry(companyId, entryId);
  }
}
