import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { TimesheetsService } from './timesheets.service';

@Controller('companies/:companyId/timesheets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimesheetsController {
  constructor(private readonly service: TimesheetsService) {}

  @Get()
  @RequirePermissions(PermissionCode.TIMESHEET_SUBMIT)
  getByDate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('date') date: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.service.findByDate(
      companyId,
      date,
      projectId ? parseInt(projectId) : undefined,
    );
  }

  @Post()
  @RequirePermissions(PermissionCode.TIMESHEET_SUBMIT)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateTimesheetDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id/submit')
  @RequirePermissions(PermissionCode.TIMESHEET_SUBMIT)
  submit(@Param('id', ParseIntPipe) id: number) {
    return this.service.submit(id);
  }

  @Patch(':id/approve')
  @RequirePermissions(PermissionCode.TIMESHEET_APPROVE)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') approvedById: number,
  ) {
    return this.service.approve(id, approvedById);
  }

  @Get('pending')
  @RequirePermissions(PermissionCode.TIMESHEET_APPROVE)
  getPending(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getPending(companyId);
  }
}

@Controller('companies/:companyId/projects/:projectId/timesheets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectTimesheetsController {
  constructor(private readonly service: TimesheetsService) {}

  @Get()
  @RequirePermissions(PermissionCode.TIMESHEET_SUBMIT)
  getByDate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('date') date: string,
  ) {
    return this.service.findByDate(companyId, date, projectId);
  }

  @Post()
  @RequirePermissions(PermissionCode.TIMESHEET_SUBMIT)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateTimesheetDto,
  ) {
    return this.service.create(companyId, dto);
  }
}
