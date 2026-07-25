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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

import { SystemRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('companies/:companyId/employees')
@UseGuards(RolesGuard)
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  @Roles(SystemRole.Owner, SystemRole.ProjectManager, SystemRole.Foreman)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Get()
  @Roles(SystemRole.Owner, SystemRole.ProjectManager, SystemRole.Foreman)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @Roles(SystemRole.Owner, SystemRole.ProjectManager)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.Owner)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
