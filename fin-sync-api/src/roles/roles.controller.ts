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
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesService } from './roles.service';

@Controller('companies/:companyId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // --- Permissions (read-only, system-level) ---

  @Get('permissions')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  // --- Custom Roles CRUD ---

  @Post('roles')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
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
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  getRoles(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.getRoles(companyId, ownerId);
  }

  @Get('roles/:id')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  getRole(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.getRole(companyId, id, ownerId);
  }

  @Patch('roles/:id')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
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
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  deleteRole(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.deleteRole(companyId, id, ownerId);
  }

  // --- Role Assignment to Staff ---

  @Patch('staff/:memberId/assign-role')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
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
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  removeRoleFromMember(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUser('id') ownerId: number,
  ) {
    return this.rolesService.removeRoleFromMember(companyId, memberId, ownerId);
  }
}
