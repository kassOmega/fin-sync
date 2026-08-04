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
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { WorkPositionsService } from './work-positions.service';

@Controller('companies/:companyId/work-positions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkPositionsController {
  constructor(private readonly service: WorkPositionsService) {}

  // ─── Positions ─────────────────────────────────────────────

  @Post()
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createPosition(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: { name: string },
  ) {
    return this.service.createPosition(companyId, dto.name);
  }

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAllPositions(companyId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  updatePosition(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { name?: string; isActive?: boolean },
  ) {
    return this.service.updatePosition(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deletePosition(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deletePosition(companyId, id);
  }

  // ─── Position Allowances ───────────────────────────────────

  @Post(':positionId/allowances')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createAllowance(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('positionId', ParseIntPipe) positionId: number,
    @Body()
    dto: {
      name: string;
      amount: number;
      isTaxable?: boolean;
      effectiveFrom: string;
      effectiveTo?: string;
      taxConfig?: Record<string, unknown> | null;
    },
  ) {
    return this.service.createAllowance(companyId, {
      ...dto,
      positionId,
    });
  }

  @Get(':positionId/allowances')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  findAllowances(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('positionId', ParseIntPipe) positionId: number,
  ) {
    return this.service.findAllowancesByPosition(companyId, positionId);
  }

  @Get('allowances/all')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  findAllAllowances(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAllAllowances(companyId);
  }

  @Patch('allowances/:allowanceId')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  updateAllowance(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('allowanceId', ParseIntPipe) allowanceId: number,
    @Body()
    dto: Partial<{
      name: string;
      amount: number;
      isTaxable: boolean;
      effectiveFrom: string;
      effectiveTo: string | null;
      isActive: boolean;
      taxConfig: Record<string, unknown> | null;
    }>,
  ) {
    return this.service.updateAllowance(companyId, allowanceId, dto);
  }

  @Delete('allowances/:allowanceId')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deleteAllowance(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('allowanceId', ParseIntPipe) allowanceId: number,
  ) {
    return this.service.deleteAllowance(companyId, allowanceId);
  }
}
