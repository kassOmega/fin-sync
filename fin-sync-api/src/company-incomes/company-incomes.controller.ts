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
import { CompanyIncomesService } from './company-incomes.service';
import { CreateCompanyIncomeDto } from './dto/create-company-income.dto';
import { UpdateCompanyIncomeDto } from './dto/update-company-income.dto';

@Controller('companies/:companyId/incomes')
@UseGuards(RolesGuard)
export class CompanyIncomesController {
  constructor(private readonly service: CompanyIncomesService) {}

  @Post()
  @Roles(SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales)
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
  @Roles(SystemRole.Owner, SystemRole.Cashier, SystemRole.ProjectManager)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @Roles(SystemRole.Owner, SystemRole.Cashier)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyIncomeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.Owner)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
