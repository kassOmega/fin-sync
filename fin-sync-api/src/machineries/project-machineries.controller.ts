import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { MachineriesService } from './machineries.service';

@Controller('companies/:companyId/projects/:projectId/machineries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectMachineriesController {
  constructor(private readonly service: MachineriesService) {}

  @Get()
  @RequirePermissions(PermissionCode.MACHINERY_READ)
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.findByProject(projectId);
  }
}
