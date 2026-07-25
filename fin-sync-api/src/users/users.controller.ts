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
import { UpdateUserDto } from './dto/update-user.dto';
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
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
  )
  getMyProfile(@CurrentUser('id') userId: number) {
    return this.usersService.getMyProfile(userId);
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
