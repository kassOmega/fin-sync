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
import { RolesService } from './roles.service';

@Controller('companies/:companyId')
@UseGuards(RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // --- Permissions (read-only, system-level) ---

  @Get('permissions')
  @Roles(SystemRole.Owner)
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  // --- Custom Roles CRUD ---

  @Post('roles')
  @Roles(SystemRole.Owner)
  createRole(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('id') ownerId: number,
    @Body() body: { name: string; permissionCodes: string[] },
  ) {
    return this.rolesService.createRole(
      companyId,
      ownerId,
      body.name,
      body.permissionCodes,
    );
  }

  @Get('roles')
  @Roles(SystemRole.Owner)
  getRoles(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.getRoles(companyId, ownerId);
  }

  @Get('roles/:id')
  @Roles(SystemRole.Owner)
  getRole(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.getRole(companyId, id, ownerId);
  }

  @Patch('roles/:id')
  @Roles(SystemRole.Owner)
  updateRole(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
    @Body() body: { name?: string; permissionCodes?: string[] },
  ) {
    return this.rolesService.updateRole(
      companyId,
      id,
      ownerId,
      body.name,
      body.permissionCodes,
    );
  }

  @Delete('roles/:id')
  @Roles(SystemRole.Owner)
  deleteRole(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.deleteRole(companyId, id, ownerId);
  }

  // --- Role Assignment to Staff ---

  @Patch('staff/:memberId/assign-role')
  @Roles(SystemRole.Owner)
  assignRoleToMember(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser('id') ownerId: number,
    @Body() body: { roleId: number },
  ) {
    return this.rolesService.assignRoleToMember(
      companyId,
      memberId,
      body.roleId,
      ownerId,
    );
  }

  @Delete('staff/:memberId/assign-role')
  @Roles(SystemRole.Owner)
  removeRoleFromMember(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.removeRoleFromMember(companyId, memberId, ownerId);
  }
}
