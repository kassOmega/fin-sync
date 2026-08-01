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
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffRoleDto, UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Any logged in user can get their own profile
  @Get('me')
  getMyProfile(@CurrentUser('id') userId: number) {
    return this.usersService.getMyProfile(userId);
  }

  // Get the user's assigned company (for non-owners to know their scope)
  @Get('me/company')
  getMyCompany(@CurrentUser('id') userId: number) {
    return this.usersService.getMyCompany(userId);
  }

  // ONLY Owner can create staff (service layer enforces this)
  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto, @CurrentUser('id') ownerId: number) {
    return this.usersService.createStaff(dto, ownerId);
  }

  // ONLY Owner can update staff
  @Patch(':id')
  updateStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.usersService.updateStaff(id, dto, ownerId);
  }

  // @Get('staff-roles')
  @Get('roles/assignable')
  @RequirePermissions(PermissionCode.EMPLOYEES_MANAGE)
  getAssignableRoles() {
    return this.usersService.getAssignableRoles();
  }

  // ONLY Owner can change a staff member's role
  @Patch(':id/role')
  updateStaffRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffRoleDto,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.usersService.updateStaff(id, { role: dto.role }, ownerId);
  }

  // ONLY Owner can delete staff
  @Delete(':id')
  deleteStaff(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.usersService.deleteStaff(id, ownerId);
  }
}
