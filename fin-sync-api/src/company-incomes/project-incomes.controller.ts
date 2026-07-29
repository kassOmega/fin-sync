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
import { CompanyIncomesService } from './company-incomes.service';
import { CreateCompanyIncomeDto } from './dto/create-company-income.dto';

@Controller('companies/:companyId/projects/:projectId/incomes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectIncomesController {
  constructor(private readonly service: CompanyIncomesService) {}

  @Get()
  @RequirePermissions(PermissionCode.FINANCE_INCOME_READ)
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.findByProject(projectId);
  }

  @Get('categories')
  @RequirePermissions(PermissionCode.FINANCE_INCOME_READ)
  getCategories(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.service.getCategoriesByProject(companyId, projectId);
  }

  @Post()
  @RequirePermissions(PermissionCode.FINANCE_INCOME_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateCompanyIncomeDto,
    @CurrentUser('id') userId: number,
  ) {
    dto.projectId = projectId;
    return this.service.create(companyId, dto, userId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.FINANCE_INCOME_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCompanyIncomeDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.FINANCE_INCOME_WRITE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
