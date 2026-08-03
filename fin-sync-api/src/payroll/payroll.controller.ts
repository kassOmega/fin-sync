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
import { GeneratePayrollDto } from './dto/create-payroll.dto';
import { PayrollService } from './payroll.service';

@Controller('companies/:companyId/payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(companyId, {
      ...(projectId && { projectId: parseInt(projectId) }),
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
  }

  @Post('generate')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  generate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: GeneratePayrollDto,
  ) {
    return this.service.generate(companyId, dto);
  }

  @Patch(':id/approve')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.service.approve(id);
  }

  @Patch(':id/paid')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  markPaid(@Param('id', ParseIntPipe) id: number) {
    return this.service.markPaid(id);
  }

  @Get('config/history')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getConfigHistory(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getPayrollConfigHistory(companyId);
  }

  @Get('config')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getConfig(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('asOf') asOf?: string,
  ) {
    return this.service.getEffectivePayrollConfig(
      companyId,
      asOf ? new Date(asOf) : undefined,
    );
  }

  @Get('deductions')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  listDeductions(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.listDeductions(companyId);
  }

  @Post('deductions')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  addDeduction(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: { name: string; type: string; value: number },
  ) {
    return this.service.addDeduction(companyId, dto);
  }

  @Patch('deductions/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  updateDeduction(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: { name?: string; type?: string; value?: number; isActive?: boolean },
  ) {
    return this.service.updateDeduction(id, dto);
  }

  @Delete('deductions/:id')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  deleteDeduction(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteDeduction(id);
  }

  @Post('config')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  createConfig(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body()
    dto: {
      effectiveFrom: string;
      taxBrackets: Array<{ upTo: number | null; rate: number; deduct: number }>;
      employeePensionRate: number;
      employerPensionRate: number;
      standardAllowanceAmount: number;
      otMultiplier: number;
      defaultPayFrequency: string;
    },
    @CurrentUser('id') userId: number,
  ) {
    return this.service.createPayrollConfigVersion(
      companyId,
      {
        effectiveFrom: new Date(dto.effectiveFrom),
        taxBrackets: dto.taxBrackets,
        employeePensionRate: dto.employeePensionRate,
        employerPensionRate: dto.employerPensionRate,
        standardAllowanceAmount: dto.standardAllowanceAmount,
        otMultiplier: dto.otMultiplier,
        defaultPayFrequency: dto.defaultPayFrequency,
      },
      userId,
    );
  }

  @Get('audit')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getAudit(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('projectId') projectId?: string,
  ) {
    return this.service.getPayrollAudit(
      companyId,
      projectId ? parseInt(projectId) : undefined,
    );
  }

  @Get('registry')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getRegistry(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCompensationRegistry(companyId);
  }

  @Get(':id/items')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getItems(@Param('id', ParseIntPipe) id: number) {
    return this.service.getItems(id);
  }

  @Get(':payrollId/items/:itemId/payslip')
  @RequirePermissions(PermissionCode.PAYSLIP_VIEW)
  getPayslip(
    @Param('payrollId', ParseIntPipe) payrollId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.service.getPayslip(payrollId, itemId);
  }
}

@Controller('companies/:companyId/projects/:projectId/payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectPayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.service.findAll(companyId, { projectId });
  }

  @Post('generate')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  generate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: GeneratePayrollDto,
  ) {
    dto.projectId = projectId;
    return this.service.generate(companyId, dto);
  }
}
