import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OvertimeService {
  constructor(private prisma: PrismaService) {}

  // ─── Overtime Rates ───────────────────────────────────────

  async getRates(companyId: number) {
    return (this.prisma as any).overtimeRate.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createRate(
    companyId: number,
    dto: { name: string; multiplier: number },
  ) {
    const existing = await (this.prisma as any).overtimeRate.findFirst({
      where: { companyId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(
        `Overtime rate "${dto.name}" already exists`,
      );
    }
    return (this.prisma as any).overtimeRate.create({
      data: { companyId, name: dto.name, multiplier: dto.multiplier },
    });
  }

  async updateRate(
    companyId: number,
    rateId: number,
    dto: { name?: string; multiplier?: number; isActive?: boolean },
  ) {
    const rate = await (this.prisma as any).overtimeRate.findFirst({
      where: { id: rateId, companyId },
    });
    if (!rate) throw new NotFoundException('Overtime rate not found');
    return (this.prisma as any).overtimeRate.update({
      where: { id: rateId },
      data: { ...dto },
    });
  }

  async deleteRate(companyId: number, rateId: number) {
    const rate = await (this.prisma as any).overtimeRate.findFirst({
      where: { id: rateId, companyId },
    });
    if (!rate) throw new NotFoundException('Overtime rate not found');
    return (this.prisma as any).overtimeRate.update({
      where: { id: rateId },
      data: { isActive: false },
    });
  }

  // ─── Overtime Entries ─────────────────────────────────────

  async getEntries(
    companyId: number,
    filters?: {
      employeeId?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { companyId };
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return (this.prisma as any).overtimeEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            hourlyRate: true,
          },
        },
        overtimeRate: { select: { id: true, name: true, multiplier: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Create overtime entry with payroll-period validation.
   * @param companyId
   * @param dto { employeeId, date, hours, overtimeRateId?, hourlyRate?, multiplier?, reason? }
   */
  async createEntry(companyId: number, dto: any, createdById?: number) {
    const emp: any = await (this.prisma as any).employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    // Resolve rate multiplier (explicit or from OvertimeRate)
    let multiplier = dto.multiplier;
    if (!multiplier && dto.overtimeRateId) {
      const rate = await (this.prisma as any).overtimeRate.findFirst({
        where: { id: dto.overtimeRateId, companyId, isActive: true },
      });
      if (rate) multiplier = Number(rate.multiplier);
    }
    if (!multiplier) multiplier = 1.5; // default OT multiplier

    const hourlyRate = dto.hourlyRate ?? Number(emp.hourlyRate || 0);
    if (!hourlyRate) {
      throw new BadRequestException(
        'Employee has no hourly rate — supply an explicit hourlyRate',
      );
    }
    if (Number(dto.hours) <= 0) {
      throw new BadRequestException('Hours must be positive');
    }

    // Refinement 1: Date/period alignment — prevent orphaned entries.
    // If a payroll exists covering this date, ensure it's still draft;
    // otherwise reject late-added entries (double-claiming protection).
    const overlappingPayroll: any = await (
      this.prisma as any
    ).payroll.findFirst({
      where: {
        companyId,
        startDate: { lte: new Date(dto.date) },
        endDate: { gte: new Date(dto.date) },
      },
    });
    if (overlappingPayroll && overlappingPayroll.status === 'APPROVED') {
      throw new BadRequestException(
        'Cannot add overtime entry — the payroll covering this date is already APPROVED.',
      );
    }

    // Double-claim guard: same employee + date + rate (or same date + hours already exists)
    const duplicate = await (this.prisma as any).overtimeEntry.findFirst({
      where: {
        companyId,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        overtimeRateId: dto.overtimeRateId ?? null,
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        'Duplicate overtime entry — an entry already exists for this employee, date, and rate.',
      );
    }

    const amount =
      Math.round(Number(dto.hours) * hourlyRate * multiplier * 100) / 100;

    return (this.prisma as any).overtimeEntry.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        overtimeRateId: dto.overtimeRateId ?? null,
        date: new Date(dto.date),
        hours: dto.hours,
        hourlyRate,
        multiplier,
        amount,
        status: 'DRAFT',
        reason: dto.reason,
        createdById: createdById ?? null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        overtimeRate: { select: { id: true, name: true, multiplier: true } },
      },
    });
  }

  async approveEntry(companyId: number, entryId: number) {
    const entry = await (this.prisma as any).overtimeEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!entry) throw new NotFoundException('Overtime entry not found');
    if (entry.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT entries can be approved');
    }
    return (this.prisma as any).overtimeEntry.update({
      where: { id: entryId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectEntry(companyId: number, entryId: number) {
    const entry = await (this.prisma as any).overtimeEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!entry) throw new NotFoundException('Overtime entry not found');
    if (entry.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT entries can be rejected');
    }
    return (this.prisma as any).overtimeEntry.update({
      where: { id: entryId },
      data: { status: 'REJECTED' },
    });
  }

  async deleteEntry(companyId: number, entryId: number) {
    const entry = await (this.prisma as any).overtimeEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!entry) throw new NotFoundException('Overtime entry not found');
    return (this.prisma as any).overtimeEntry.delete({
      where: { id: entryId },
    });
  }
}
