import {
  Body,
  Controller,
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
import { DepreciationsService } from './depreciations.service';

@Controller('companies/:companyId/depreciations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepreciationsController {
  constructor(private readonly service: DepreciationsService) {}

  // ─── Methods ─────────────────────────────────────────────

  @Post('methods')
  @RequirePermissions(PermissionCode.DEPRECIATION_MANAGE)
  createMethod(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: {
      name: string;
      type: string;
      defaultRate: number;
      defaultUsefulLifeYears?: number;
    },
  ) {
    return this.service.createMethod(companyId, dto);
  }

  @Get('methods')
  @RequirePermissions(PermissionCode.DEPRECIATION_VIEW)
  getMethods(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getMethods(companyId);
  }

  // ─── Machinery Configuration ─────────────────────────────

  @Patch('machineries/:machineryId')
  @RequirePermissions(PermissionCode.DEPRECIATION_MANAGE)
  enableDepreciation(
    @Param('machineryId', ParseIntPipe) machineryId: number,
    @Body()
    dto: {
      purchaseDate?: string;
      purchaseCost: number;
      residualValue?: number;
      usefulLifeYears?: number;
      depMethodId: number;
    },
  ) {
    return this.service.enableDepreciation(machineryId, dto);
  }

  // ─── Schedule Generation ─────────────────────────────────

  @Post('generate')
  @RequirePermissions(PermissionCode.DEPRECIATION_MANAGE)
  generate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('month') month?: string,
  ) {
    return this.service.generateCompanyMonth(companyId, month);
  }

  @Post('post')
  @RequirePermissions(PermissionCode.DEPRECIATION_MANAGE)
  postMonth(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('month') month?: string,
  ) {
    return this.service.postCompanyMonth(companyId, month);
  }

  @Post('schedules/:scheduleId/post')
  @RequirePermissions(PermissionCode.DEPRECIATION_MANAGE)
  postSchedule(@Param('scheduleId', ParseIntPipe) scheduleId: number) {
    return this.service.postSchedule(scheduleId);
  }

  // ─── Queries ─────────────────────────────────────────────

  @Get('schedules')
  @RequirePermissions(PermissionCode.DEPRECIATION_VIEW)
  getSchedules(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('machineryId') machineryId?: string,
  ) {
    return this.service.getSchedules(
      companyId,
      machineryId ? parseInt(machineryId) : undefined,
    );
  }

  @Get('net-book-value')
  @RequirePermissions(PermissionCode.DEPRECIATION_VIEW)
  getNetBookValues(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getNetBookValues(companyId);
  }
}
