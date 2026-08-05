import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  // ─── Leave Types ────────────────────────────────────────────

  async createLeaveType(companyId: number, dto: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findFirst({
      where: { companyId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Leave type "${dto.name}" already exists for this company`,
      );
    }
    return this.prisma.leaveType.create({
      data: {
        companyId,
        name: dto.name,
        isPaid: dto.isPaid ?? true,
        defaultDaysPerYear: dto.defaultDaysPerYear ?? 20,
        maxCarryForwardDays: dto.maxCarryForwardDays ?? null,
        requiresApproval: dto.requiresApproval ?? true,
      },
    });
  }

  async getLeaveTypes(companyId: number) {
    return this.prisma.leaveType.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateLeaveType(id: number, dto: Partial<CreateLeaveTypeDto>) {
    return this.prisma.leaveType.update({
      where: { id },
      data: { ...dto },
    });
  }

  async deleteLeaveType(id: number) {
    return this.prisma.leaveType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Leave Balances ─────────────────────────────────────────

  /**
   * Get or create a leave balance for an employee for the current year.
   */
  async getOrCreateBalance(employeeId: number, leaveTypeId: number) {
    const year = new Date().getFullYear();

    let balance = await this.prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId, year },
      include: {
        leaveType: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    if (!balance) {
      const leaveType = await this.prisma.leaveType.findUnique({
        where: { id: leaveTypeId },
      });
      if (!leaveType) throw new NotFoundException('Leave type not found');

      // Check for carried forward days from previous year
      let carriedForward = 0;
      const prevBalance = await this.prisma.leaveBalance.findFirst({
        where: { employeeId, leaveTypeId, year: year - 1 },
      });
      if (prevBalance && leaveType.maxCarryForwardDays) {
        const unusedDays = prevBalance.totalDays - prevBalance.usedDays;
        carriedForward = Math.min(unusedDays, leaveType.maxCarryForwardDays);
      }

      balance = await this.prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId,
          year,
          totalDays: leaveType.defaultDaysPerYear + carriedForward,
          carriedForwardDays: carriedForward,
        },
        include: {
          leaveType: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      });
    }

    return balance;
  }

  async getEmployeeBalances(employeeId: number | null) {
    // No employee linked to the account → no balances to show.
    if (!employeeId) return [];

    const year = new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
      orderBy: { leaveType: { name: 'asc' } },
    });
  }

  // ─── Leave Requests ─────────────────────────────────────────

  /**
   * Calculate business days between two dates (excludes weekends).
   */
  private calculateBusinessDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++; // Skip Sunday(0) and Saturday(6)
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  async submitRequest(
    employeeId: number,
    companyId: number,
    dto: CreateLeaveRequestDto,
  ) {
    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: dto.leaveTypeId, companyId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate total days requested
    let totalDays: number;
    if (dto.isHalfDay) {
      totalDays = 0.5;
    } else {
      totalDays = this.calculateBusinessDays(start, end);
    }

    if (totalDays <= 0) {
      throw new BadRequestException('Leave request must be at least 0.5 days');
    }

    // Check balance
    const balance = await this.getOrCreateBalance(employeeId, dto.leaveTypeId);
    const available =
      balance.totalDays - balance.usedDays - balance.pendingDays;

    if (totalDays > available) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${available} days, Requested: ${totalDays} days`,
      );
    }

    // Check for overlapping approved/pending requests
    const overlapping = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
      },
    });
    if (overlapping) {
      throw new ConflictException(
        'You already have a leave request overlapping these dates',
      );
    }

    // Create request and update pending days
    const request = await this.prisma.$transaction(async (prisma) => {
      const req = await prisma.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: dto.leaveTypeId,
          companyId,
          startDate: start,
          endDate: end,
          totalDays,
          isHalfDay: dto.isHalfDay ?? false,
          reason: dto.reason,
          status: 'PENDING',
        },
        include: {
          leaveType: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      });

      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: totalDays } },
      });

      return req;
    });

    return request;
  }

  /**
   * Update a PENDING leave request (dates, leave type, reason, half-day).
   * Recomputes totalDays and re-adjusts the pending balance delta.
   * Used by the Team Calendar CRUD.
   */
  async updateRequest(
    requestId: number,
    dto: {
      leaveTypeId?: number;
      startDate?: string;
      endDate?: string;
      isHalfDay?: boolean;
      reason?: string;
    },
  ) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        'Only PENDING requests can be edited from the calendar',
      );
    }

    const start = dto.startDate ? new Date(dto.startDate) : request.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : request.endDate;
    const isHalfDay = dto.isHalfDay ?? request.isHalfDay;
    const reason = dto.reason !== undefined ? dto.reason : request.reason;

    let totalDays: number;
    if (isHalfDay) {
      totalDays = 0.5;
    } else {
      totalDays = this.calculateBusinessDays(start, end);
    }
    if (totalDays <= 0) {
      throw new BadRequestException('Leave request must be at least 0.5 days');
    }

    return this.prisma.$transaction(async (prisma) => {
      const oldDays = Number(request.totalDays);
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          leaveTypeId: dto.leaveTypeId ?? request.leaveTypeId,
          startDate: start,
          endDate: end,
          totalDays,
          isHalfDay,
          reason,
        },
      });

      // Re-adjust pending balance: remove old delta, add new delta
      if (oldDays !== totalDays || dto.leaveTypeId) {
        // Restore pending for the old type
        await this.adjustPending(
          prisma,
          request.employeeId,
          request.leaveTypeId,
          -oldDays,
        );
        // Add pending for the (possibly new) type
        await this.adjustPending(
          prisma,
          request.employeeId,
          dto.leaveTypeId ?? request.leaveTypeId,
          totalDays,
        );
      }

      return { updated: true, id: requestId, totalDays };
    });
  }

  /** Internal helper: change pendingDays on the current-year balance. */
  private async adjustPending(
    prisma: any,
    employeeId: number,
    leaveTypeId: number,
    delta: number,
  ) {
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId, year: new Date().getFullYear() },
    });
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: delta } },
      });
    }
  }

  async approveRequest(requestId: number, reviewerId: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be approved');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });

      // Move from pending to used — decrement pendingDays AND increment usedDays
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: new Date().getFullYear(),
        },
      });
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { decrement: request.totalDays },
            usedDays: { increment: request.totalDays },
          },
        });
      }

      // Auto-mark the employee present in attendance for each approved leave date.
      // Paid/special/sick → PRESENT (HALF_DAY for half-day requests); unpaid → ON_LEAVE.
      const leaveType = await prisma.leaveType.findUnique({
        where: { id: request.leaveTypeId },
      });
      const isPaid = leaveType?.isPaid ?? true;
      const leaveStatus = request.isHalfDay
        ? 'HALF_DAY'
        : isPaid
          ? 'PRESENT'
          : 'ON_LEAVE';
      const leaveRemark = `Approved leave: ${leaveType?.name || 'Leave'}`;
      const leaveStart = new Date(request.startDate);
      const leaveEnd = new Date(request.endDate);
      for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
        const day = new Date(d);
        await prisma.attendance.upsert({
          where: {
            employeeId_date: { employeeId: request.employeeId, date: day },
          },
          update: { status: leaveStatus, remarks: leaveRemark },
          create: {
            companyId: request.companyId,
            employeeId: request.employeeId,
            date: day,
            status: leaveStatus,
            remarks: leaveRemark,
          },
        });
      }

      return { approved: true, id: requestId };
    });
  }

  async rejectRequest(requestId: number, reviewerId: number, reason?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be rejected');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Restore pending days
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: new Date().getFullYear(),
        },
      });
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { decrement: request.totalDays } },
        });
      }

      return { rejected: true, id: requestId };
    });
  }

  async cancelRequest(requestId: number) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED requests can be cancelled');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' },
      });

      // Restore used days
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: new Date().getFullYear(),
        },
      });
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: { decrement: request.totalDays } },
        });
      }

      return { cancelled: true, id: requestId };
    });
  }

  async getEmployeeRequests(employeeId: number | null, status?: string) {
    // No employee linked to the account → no requests to show.
    if (!employeeId) return [];

    const where: any = { employeeId };
    if (status) where.status = status;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompanyRequests(companyId: number, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Calendar View ──────────────────────────────────────────

  async getCalendar(companyId: number, startDate: string, endDate: string) {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        companyId,
        status: 'APPROVED',
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
          },
        },
        leaveType: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return requests.map((req) => ({
      id: req.id,
      employeeId: req.employeeId,
      employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
      employeeCode: req.employee.employeeCode,
      designation: req.employee.designation,
      leaveType: req.leaveType.name,
      startDate: req.startDate,
      endDate: req.endDate,
      totalDays: req.totalDays,
      isHalfDay: req.isHalfDay,
      reason: req.reason,
    }));
  }
}
