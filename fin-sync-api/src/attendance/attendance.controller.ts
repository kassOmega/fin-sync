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

@Controller('companies/:companyId/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  @RequirePermissions(PermissionCode.ATTENDANCE_READ)
  getByDate(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('date') date: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.service.getByDate(
      companyId,
      date,
      projectId ? parseInt(projectId) : undefined,
    );
  }

  @Post(':employeeId')
  @RequirePermissions(PermissionCode.ATTENDANCE_WRITE)
  mark(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.service.mark(companyId, employeeId, dto);
  }

  @Get('employee/:employeeId')
  @RequirePermissions(PermissionCode.ATTENDANCE_READ)
  getEmployeeRecords(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return this.service.getEmployeeRecords(companyId, employeeId);
  }
}
