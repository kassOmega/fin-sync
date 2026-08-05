import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { LeavesService } from './leaves.service';

@Controller('companies/:companyId/leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  /** Resolve the signed-in user's employee record, or reject with a clear message. */
  private requireEmployee(employeeId: number | null): number {
    if (!employeeId) {
      throw new BadRequestException(
        'Your user account is not linked to an employee record.',
      );
    }
    return employeeId;
  }

  // ─── Leave Types ──────────────────────────────────────────

  @Post('types')
  @RequirePermissions(PermissionCode.LEAVE_TYPE_MANAGE)
  createLeaveType(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateLeaveTypeDto,
  ) {
    return this.service.createLeaveType(companyId, dto);
  }

  @Get('types')
  getLeaveTypes(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getLeaveTypes(companyId);
  }

  @Patch('types/:id')
  @RequirePermissions(PermissionCode.LEAVE_TYPE_MANAGE)
  updateLeaveType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateLeaveTypeDto>,
  ) {
    return this.service.updateLeaveType(id, dto);
  }

  @Delete('types/:id')
  @RequirePermissions(PermissionCode.LEAVE_TYPE_MANAGE)
  deleteLeaveType(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteLeaveType(id);
  }

  // ─── Balances ─────────────────────────────────────────────

  @Get('balances')
  getMyBalances(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('employeeId') employeeId: number,
  ) {
    // Self-service: returns only the signed-in user's own balances.
    return this.service.getEmployeeBalances(employeeId);
  }

  @Get('employees/:employeeId/balances')
  @RequirePermissions(PermissionCode.LEAVE_BALANCE_VIEW)
  getEmployeeBalances(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.service.getEmployeeBalances(employeeId);
  }

  // ─── Requests ─────────────────────────────────────────────

  @Post('requests')
  @RequirePermissions(PermissionCode.LEAVE_REQUEST_CREATE)
  submitRequest(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('employeeId') employeeId: number,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.service.submitRequest(
      this.requireEmployee(employeeId),
      companyId,
      dto,
    );
  }

  @Get('requests')
  getMyRequests(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser('employeeId') employeeId: number,
    @Query('status') status?: string,
  ) {
    return this.service.getEmployeeRequests(employeeId, status);
  }

  @Get('requests/all')
  @RequirePermissions(PermissionCode.LEAVE_REQUEST_APPROVE)
  getCompanyRequests(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('status') status?: string,
  ) {
    return this.service.getCompanyRequests(companyId, status);
  }

  @Patch('requests/:id')
  @RequirePermissions(PermissionCode.LEAVE_REQUEST_CREATE)
  updateRequest(
    @Param('id', ParseIntPipe) requestId: number,
    @Body()
    dto: {
      leaveTypeId?: number;
      startDate?: string;
      endDate?: string;
      isHalfDay?: boolean;
      reason?: string;
    },
  ) {
    return this.service.updateRequest(requestId, dto);
  }

  @Post('requests/:id/approve')
  @RequirePermissions(PermissionCode.LEAVE_REQUEST_APPROVE)
  approveRequest(
    @Param('id', ParseIntPipe) requestId: number,
    @CurrentUser('employeeId') reviewerId: number,
  ) {
    return this.service.approveRequest(requestId, this.requireEmployee(reviewerId));
  }

  @Post('requests/:id/reject')
  @RequirePermissions(PermissionCode.LEAVE_REQUEST_APPROVE)
  rejectRequest(
    @Param('id', ParseIntPipe) requestId: number,
    @CurrentUser('employeeId') reviewerId: number,
    @Body('reason') reason?: string,
  ) {
    return this.service.rejectRequest(
      requestId,
      this.requireEmployee(reviewerId),
      reason,
    );
  }

  @Post('requests/:id/cancel')
  cancelRequest(@Param('id', ParseIntPipe) requestId: number) {
    return this.service.cancelRequest(requestId);
  }

  // ─── Calendar ─────────────────────────────────────────────

  @Get('calendar')
  getCalendar(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.getCalendar(companyId, startDate, endDate);
  }
}
