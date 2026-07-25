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
import { SystemRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CompanyExpensesService } from './company-expenses.service';
import { CreateCompanyExpenseDto } from './dto/create-company-expense.dto';
import { UpdateCompanyExpenseDto } from './dto/update-company-expense.dto';

@Controller('companies/:companyId/expenses')
@UseGuards(RolesGuard)
export class CompanyExpensesController {
  constructor(private readonly service: CompanyExpensesService) {}

  @Post()
  @Roles(SystemRole.Owner, SystemRole.Cashier, SystemRole.OperatorDriver)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateCompanyExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(companyId, dto, user.id);
  }

  @Get()
  @Roles(SystemRole.Owner, SystemRole.Cashier, SystemRole.ProjectManager)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.findAll(companyId, user);
  }

  @Patch(':id')
  @Roles(SystemRole.Owner, SystemRole.Cashier)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(SystemRole.Owner, SystemRole.Cashier)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.remove(id, user);
  }
}
