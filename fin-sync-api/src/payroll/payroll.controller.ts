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
  ) {
    return this.service.findAll(
      companyId,
      projectId ? parseInt(projectId) : undefined,
    );
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

  @Get(':id/items')
  @RequirePermissions(PermissionCode.PAYROLL_MANAGE)
  getItems(@Param('id', ParseIntPipe) id: number) {
    return this.service.getItems(id);
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
    return this.service.findAll(companyId, projectId);
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
