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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

import { SystemRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('companies')
@UseGuards(RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(SystemRole.Owner)
  create(@Body() dto: CreateCompanyDto, @CurrentUser('id') userId: number) {
    return this.companiesService.create(dto, userId);
  }

  @Get()
  @Roles(SystemRole.Owner)
  findAll(@CurrentUser('id') userId: number) {
    return this.companiesService.findAllByOwner(userId);
  }

  @Get(':id')
  @Roles(
    SystemRole.Owner,
    SystemRole.Cashier,
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Get(':id/staff')
  @Roles(SystemRole.Owner)
  getStaff(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getCompanyStaff(id);
  }

  @Patch(':id')
  @Roles(SystemRole.Owner)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.companiesService.update(id, userId, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.Owner)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.companiesService.remove(id, userId);
  }
}
