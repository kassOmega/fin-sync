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

import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @RequirePermissions(PermissionCode.COMPANY_WRITE)
  create(@Body() dto: CreateCompanyDto, @CurrentUser('id') userId: number) {
    return this.companiesService.create(dto, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.COMPANY_READ)
  findAll(@CurrentUser('id') userId: number) {
    return this.companiesService.findAllByOwner(userId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.COMPANY_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Get(':id/staff')
  @RequirePermissions(PermissionCode.COMPANY_STAFF_MANAGE)
  getStaff(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getCompanyStaff(id);
  }

  @Patch(':id/staff/:memberId/role')
  @RequirePermissions(
    PermissionCode.COMPANY_STAFF_MANAGE,
    PermissionCode.ROLE_MANAGE,
  )
  updateStaffRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() body: { role: string },
    @CurrentUser('id') userId: number,
  ) {
    return this.companiesService.updateStaffRole(
      id,
      memberId,
      body.role,
      userId,
    );
  }

  @Delete(':id/staff/:memberId')
  @RequirePermissions(PermissionCode.COMPANY_STAFF_MANAGE)
  removeStaff(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.companiesService.removeStaffMember(id, memberId, userId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.COMPANY_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.companiesService.update(id, userId, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.COMPANY_DELETE)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.companiesService.remove(id, userId);
  }
}
