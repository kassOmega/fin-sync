import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@Controller('companies/:companyId/projects/:projectId/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectAttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  @RequirePermissions(PermissionCode.ATTENDANCE_READ)
  getByDate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('date') date: string,
  ) {
    return this.service.getByDate(companyId, date, projectId);
  }

  @Post(':employeeId')
  @RequirePermissions(PermissionCode.ATTENDANCE_WRITE)
  mark(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Body() dto: MarkAttendanceDto,
  ) {
    dto.projectId = projectId;
    return this.service.mark(companyId, employeeId, dto);
  }
}
