import {
  Body,
  Controller,
  Delete,
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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('companies/:companyId/employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('employmentType') employmentType?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(companyId, {
      ...(employmentType && { employmentType }),
      ...(isActive !== undefined && { isActive }),
      ...(search && { search }),
    });
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateEmployeeDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
