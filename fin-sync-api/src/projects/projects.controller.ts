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

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('companies/:companyId/projects')
@UseGuards(RolesGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post()
  @Roles(SystemRole.Owner)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateProjectDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Get()
  @Roles(SystemRole.Owner, SystemRole.ProjectManager, SystemRole.Foreman)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Patch(':id')
  @Roles(SystemRole.Owner, SystemRole.ProjectManager)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.Owner)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
