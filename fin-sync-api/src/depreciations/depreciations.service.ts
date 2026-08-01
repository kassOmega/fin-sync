import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepreciationsService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  // ─── Depreciation Methods ─────────────────────────────────

  async createMethod(
    companyId: number,
    dto: {
      name: string;
      type: string;
      defaultRate: number;
      defaultUsefulLifeYears?: number;
    },
  ) {
    return (this.prisma as any).depreciationMethod.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        defaultRate: dto.defaultRate,
        defaultUsefulLifeYears: dto.defaultUsefulLifeYears ?? 5,
      },
    });
  }

  async getMethods(companyId: number) {
    return (this.prisma as any).depreciationMethod.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Machinery Depreciation Configuration ─────────────────

  async enableDepreciation(
    machineryId: number,
    dto: {
      purchaseDate?: string;
      purchaseCost: number;
      residualValue?: number;
      usefulLifeYears?: number;
      depMethodId: number;
    },
  ) {
    const machinery: any = await (this.prisma as any).machinery.findUnique({
      where: { id: machineryId },
    });
    if (!machinery) throw new NotFoundException('Machinery not found');

    return (this.prisma as any).machinery.update({
      where: { id: machineryId },
      data: {
        purchaseDate: dto.purchaseDate
          ? new Date(dto.purchaseDate)
          : new Date(),
        purchaseCost: dto.purchaseCost,
        residualValue: dto.residualValue ?? 0,
        usefulLifeYears: dto.usefulLifeYears ?? null,
        depMethodId: dto.depMethodId,
        depreciationEnabled: true,
      },
    });
  }

  // ─── Schedule Generation ──────────────────────────────────

  async generateSchedule(machineryId: number, startDate: Date, endDate: Date) {
    const machinery: any = await (this.prisma as any).machinery.findUnique({
      where: { id: machineryId },
      include: { depMethod: true },
    });
    if (!machinery) throw new NotFoundException('Machinery not found');
    if (!machinery.depreciationEnabled) {
      throw new BadRequestException(
        'Depreciation is not enabled for this machinery',
      );
    }

    const existing = await (this.prisma as any).depreciationSchedule.findFirst({
      where: { machineryId, startDate, endDate },
    });
    if (existing) return existing;

    const lastSchedule: any = await (
      this.prisma as any
    ).depreciationSchedule.findFirst({
      where: { machineryId, status: 'POSTED' },
      orderBy: { endDate: 'desc' },
    });

    const purchaseCost = parseFloat(String(machinery.purchaseCost || 0));
    const residualValue = parseFloat(String(machinery.residualValue || 0));
    const usefulLifeYears =
      machinery.usefulLifeYears ||
      machinery.depMethod?.defaultUsefulLifeYears ||
      5;
    const methodType = machinery.depMethod?.type || 'STRAIGHT_LINE';
    const methodRate = parseFloat(
      String(machinery.depMethod?.defaultRate || 20),
    );

    let monthlyDepreciation: number;
    if (methodType === 'STRAIGHT_LINE') {
      const annualDepreciation =
        (purchaseCost - residualValue) / usefulLifeYears;
      monthlyDepreciation = annualDepreciation / 12;
    } else {
      const annualRate = methodRate / 100;
      const priorAccumulated = lastSchedule
        ? parseFloat(String(lastSchedule.accumulatedDepreciation))
        : 0;
      const currentNetBookValue = purchaseCost - priorAccumulated;
      monthlyDepreciation = currentNetBookValue * (annualRate / 12);
    }

    const priorAccumulated = lastSchedule
      ? parseFloat(String(lastSchedule.accumulatedDepreciation))
      : 0;
    const maxDepreciable = purchaseCost - residualValue;
    const remainingDepreciable = maxDepreciable - priorAccumulated;

    if (monthlyDepreciation > remainingDepreciable) {
      monthlyDepreciation = remainingDepreciable;
    }
    if (monthlyDepreciation <= 0) {
      throw new BadRequestException('Machinery is fully depreciated');
    }

    const newAccumulated = priorAccumulated + monthlyDepreciation;
    const netBookValue = purchaseCost - newAccumulated;

    return (this.prisma as any).depreciationSchedule.create({
      data: {
        machineryId,
        startDate,
        endDate,
        depreciationAmount: Math.round(monthlyDepreciation * 100) / 100,
        accumulatedDepreciation: Math.round(newAccumulated * 100) / 100,
        netBookValue: Math.round(netBookValue * 100) / 100,
        status: 'PLANNED',
      },
    });
  }

  async generateCompanyMonth(companyId: number, month?: string) {
    const date = month ? new Date(month + '-01') : new Date();
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const machines: any[] = await (this.prisma as any).machinery.findMany({
      where: { companyId, depreciationEnabled: true },
      include: { depMethod: true },
    });

    const schedules: any[] = [];
    for (const m of machines) {
      try {
        const schedule = await this.generateSchedule(m.id, startDate, endDate);
        if (schedule.status === 'PLANNED') schedules.push(schedule);
      } catch {
        // Skip fully depreciated or unconfigurable machines
      }
    }

    return {
      month: `${startDate.toISOString().slice(0, 7)}`,
      generated: schedules.length,
      schedules,
    };
  }

  async postSchedule(scheduleId: number) {
    const schedule: any = await (
      this.prisma as any
    ).depreciationSchedule.findUnique({
      where: { id: scheduleId },
      include: { machinery: { include: { depMethod: true } } },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.status === 'POSTED') {
      throw new BadRequestException('Schedule is already posted');
    }

    const amount = parseFloat(schedule.depreciationAmount);

    const entry = await this.ledger.createAutoEntry(
      schedule.machinery.companyId,
      {
        sourceType: 'DEPRECIATION',
        sourceId: schedule.machineryId,
        description: `Depreciation: ${schedule.machinery.name} (${schedule.startDate.toISOString().slice(0, 7)})`,
        date: schedule.endDate,
        lines: [
          {
            accountCode: '5200',
            description: 'Depreciation Expense',
            debit: amount,
            credit: 0,
          },
          {
            accountCode: '1550',
            description: 'Accumulated Depreciation',
            debit: 0,
            credit: amount,
          },
        ],
      },
    );

    return (this.prisma as any).depreciationSchedule.update({
      where: { id: scheduleId },
      data: {
        status: 'POSTED',
        journalEntryId: entry.id,
      },
    });
  }

  async postCompanyMonth(companyId: number, month?: string) {
    const date = month ? new Date(month + '-01') : new Date();
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const schedules: any[] = await (
      this.prisma as any
    ).depreciationSchedule.findMany({
      where: {
        machinery: { companyId },
        status: 'PLANNED',
        startDate,
        endDate,
      },
    });

    let posted = 0;
    for (const s of schedules) {
      try {
        await this.postSchedule(s.id);
        posted++;
      } catch {}
    }

    return { month: `${startDate.toISOString().slice(0, 7)}`, posted };
  }

  // ─── Queries ──────────────────────────────────────────────

  async getSchedules(companyId: number, machineryId?: number) {
    const where: any = { machinery: { companyId } };
    if (machineryId) where.machineryId = machineryId;

    return (this.prisma as any).depreciationSchedule.findMany({
      where,
      include: {
        machinery: {
          select: { id: true, name: true, code: true, companyId: true },
        },
      },
      orderBy: [{ machineryId: 'asc' }, { endDate: 'desc' }],
    });
  }

  async getNetBookValues(companyId: number) {
    const machines: any[] = await (this.prisma as any).machinery.findMany({
      where: { companyId, depreciationEnabled: true },
      include: {
        depMethod: true,
        depreciationSchedules: {
          where: { status: 'POSTED' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    return machines.map((m) => ({
      id: m.id,
      name: m.name,
      code: m.code,
      purchaseCost: parseFloat(String(m.purchaseCost || 0)),
      residualValue: parseFloat(String(m.residualValue || 0)),
      method: m.depMethod?.name || 'None',
      accumulatedDepreciation: m.depreciationSchedules[0]
        ? parseFloat(m.depreciationSchedules[0].accumulatedDepreciation)
        : 0,
      netBookValue: m.depreciationSchedules[0]
        ? parseFloat(m.depreciationSchedules[0].netBookValue)
        : parseFloat(String(m.purchaseCost || 0)),
    }));
  }

  // ─── Monthly Automation ────────────────────────────────────

  /**
   * Runs on the 1st of every month at 00:05.
   * Auto-generates and posts depreciation schedules for all companies.
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async monthlyDepreciationCron() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);

    const companies: any[] = await (this.prisma as any).company.findMany();

    let totalGenerated = 0;
    let totalPosted = 0;

    for (const company of companies) {
      try {
        const { generated } = await this.generateCompanyMonth(company.id);
        totalGenerated += generated;
        const { posted } = await this.postCompanyMonth(company.id);
        totalPosted += posted;
      } catch {}
    }

    return {
      ran: true,
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      generated: totalGenerated,
      posted: totalPosted,
    };
  }
}
