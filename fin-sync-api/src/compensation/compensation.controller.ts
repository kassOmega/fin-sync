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
import { CompensationService } from './compensation.service';

@Controller('companies/:companyId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompensationController {
  constructor(private readonly service: CompensationService) {}

  // ─── Allowances ───────────────────────────────────────────

  @Get('allowances')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getAllowances(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.getAllowances(companyId, {
      ...(employeeId && { employeeId: parseInt(employeeId) }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    });
  }

  @Post('allowances')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createAllowance(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: {
      employeeId: number;
      type: string;
      amount: number;
      isTaxable?: boolean;
      reason?: string;
      effectiveDate: string;
      expiryDate?: string;
    },
  ) {
    return this.service.createAllowance(companyId, dto);
  }

  @Patch('allowances/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  updateAllowance(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateAllowance(companyId, id, dto);
  }

  @Delete('allowances/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deleteAllowance(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteAllowance(companyId, id);
  }

  // ─── Bonuses ──────────────────────────────────────────────

  @Get('bonuses')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getBonuses(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.getBonuses(companyId, {
      ...(employeeId && { employeeId: parseInt(employeeId) }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
    });
  }

  @Post('bonuses')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createBonus(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: {
      employeeId: number;
      type: string;
      amount: number;
      reason?: string;
      effectiveDate: string;
      expiryDate?: string;
    },
  ) {
    return this.service.createBonus(companyId, dto);
  }

  @Patch('bonuses/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  updateBonus(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateBonus(companyId, id, dto);
  }

  @Delete('bonuses/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deleteBonus(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteBonus(companyId, id);
  }

  // ─── Withholdings ─────────────────────────────────────────

  @Get('withholdings')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getWithholdings(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('isGlobal') isGlobal?: string,
  ) {
    return this.service.getWithholdings(companyId, {
      ...(employeeId && { employeeId: parseInt(employeeId) }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
      ...(isGlobal !== undefined && { isGlobal }),
    });
  }

  @Post('withholdings')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createWithholding(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: {
      employeeId: number;
      type: string;
      amount: number;
      reason: string; // REQUIRED
      effectiveDate: string;
      expiryDate?: string;
    },
  ) {
    return this.service.createWithholding(companyId, dto);
  }

  @Patch('withholdings/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  updateWithholding(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.service.updateWithholding(companyId, id, dto);
  }

  @Delete('withholdings/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deleteWithholding(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteWithholding(companyId, id);
  }
}
