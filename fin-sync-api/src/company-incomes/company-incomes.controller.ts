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
import { UpdateCompanyIncomeDto } from './dto/update-company-income.dto';

@Controller('companies/:companyId/incomes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyIncomesController {
  constructor(private readonly service: CompanyIncomesService) {}

  @Post()
  @RequirePermissions(PermissionCode.FINANCE_INCOME_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateCompanyIncomeDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  @Get('categories')
  getCategories(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCategories(companyId);
  }

  @Get()
  @RequirePermissions(PermissionCode.FINANCE_INCOME_READ)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.FINANCE_INCOME_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyIncomeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.FINANCE_INCOME_WRITE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
