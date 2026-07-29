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

import { PermissionCode } from '../common/constants/permission-codes';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('companies/:companyId/employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Get()
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
