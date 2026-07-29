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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('companies/:companyId/projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post()
  @RequirePermissions(PermissionCode.PROJECTS_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateProjectDto,
  ) {
    return this.service.create(companyId, dto);
  }

  // Assigned-only view for ProjectManager / Foreman
  @Get('my')
  getMyProjects(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.findMyProjects(companyId, userId);
  }

  @Get()
  @RequirePermissions(PermissionCode.PROJECTS_READ)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.PROJECTS_WRITE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.PROJECTS_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // Assign a user to a project (supports multiple assignments per user)
  @Post(':id/assign')
  @RequirePermissions(PermissionCode.PROJECTS_WRITE)
  assignUser(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() body: { userId: number },
  ) {
    return this.service.assignUser(projectId, body.userId);
  }

  // Unassign a user from a project
  @Delete(':id/assign/:userId')
  @RequirePermissions(PermissionCode.PROJECTS_WRITE)
  unassignUser(
    @Param('id', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.service.unassignUser(projectId, userId);
  }
}
