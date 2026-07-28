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
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffRoleDto, UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Any logged in user can get their own profile
  @Get('me')
  @Roles(
    SystemRole.Owner,
    SystemRole.Cashier,
    SystemRole.Sales,
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
  )
  getMyProfile(@CurrentUser('id') userId: number) {
    return this.usersService.getMyProfile(userId);
  }

  // Get the user's assigned company (for non-owners to know their scope)
  @Get('me/company')
  getMyCompany(@CurrentUser('id') userId: number) {
    return this.usersService.getMyCompany(userId);
  }

  // ONLY Owner can create staff
  @Post('staff')
  @Roles(SystemRole.Owner)
  createStaff(@Body() dto: CreateStaffDto, @CurrentUser('id') ownerId: number) {
    return this.usersService.createStaff(dto, ownerId);
  }

  // ONLY Owner can update staff
  @Patch(':id')
  @Roles(SystemRole.Owner)
  updateStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.usersService.updateStaff(id, dto, ownerId);
  }

  // ONLY Owner can change a staff member's role
  @Patch(':id/role')
  @Roles(SystemRole.Owner)
  updateStaffRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffRoleDto,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.usersService.updateStaff(id, { role: dto.role }, ownerId);
  }

  // ONLY Owner can delete staff
  @Delete(':id')
  @Roles(SystemRole.Owner)
  deleteStaff(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.usersService.deleteStaff(id, ownerId);
  }
}
