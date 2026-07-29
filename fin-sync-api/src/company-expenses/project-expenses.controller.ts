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

@Controller('companies/:companyId/projects/:projectId/expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectExpensesController {
  constructor(private readonly service: CompanyExpensesService) {}

  @Get()
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_READ)
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.findByProject(projectId);
  }

  @Get('categories')
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_READ)
  getCategories(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.service.getCategoriesByProject(companyId, projectId);
  }

  @Post()
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateCompanyExpenseDto,
    @CurrentUser('id') userId: number,
  ) {
    dto.projectId = projectId;
    return this.service.create(companyId, dto, userId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCompanyExpenseDto>,
  ) {
    return this.service.update(id, dto, { role: 'Owner' });
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.FINANCE_EXPENSE_WRITE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, { role: 'Owner' });
  }
}
