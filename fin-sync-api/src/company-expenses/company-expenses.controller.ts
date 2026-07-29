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
import { CompanyExpensesService } from './company-expenses.service';
import { CreateCompanyExpenseDto } from './dto/create-company-expense.dto';
import { UpdateCompanyExpenseDto } from './dto/update-company-expense.dto';

@Controller('companies/:companyId/expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyExpensesController {
  constructor(private readonly service: CompanyExpensesService) {}

  @Post()
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateCompanyExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(companyId, dto, user.id);
  }

  @Get('categories')
  getCategories(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCategories(companyId);
  }

  @Get()
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_READ)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.findAll(companyId, user);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_WRITE)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
