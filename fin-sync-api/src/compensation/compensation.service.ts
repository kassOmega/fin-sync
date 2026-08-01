import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompensationService {
  constructor(private prisma: PrismaService) {}

  // Allowances
  async getAllowances(
    companyId: number,
    filters?: { employeeId?: number; type?: string; isActive?: string },
  ) {
    const where: any = { companyId };
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined && filters.isActive !== '')
      where.isActive = filters.isActive === 'true';
    return (this.prisma as any).payrollAllowance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async createAllowance(
    companyId: number,
    dto: {
      employeeId: number;
      type: string;
      amount: number;
      isTaxable?: boolean;
      reason?: string;
      effectiveDate: string;
      expiryDate?: string;
    },
  ) {
    const emp = await (this.prisma as any).employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    if (dto.amount <= 0)
      throw new BadRequestException('Amount must be positive');
    return (this.prisma as any).payrollAllowance.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        type: dto.type,
        amount: dto.amount,
        isTaxable: dto.isTaxable ?? true,
        reason: dto.reason,
        effectiveDate: new Date(dto.effectiveDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });
  }

  async updateAllowance(companyId: number, id: number, dto: any) {
    const rec = await (this.prisma as any).payrollAllowance.findFirst({
      where: { id, companyId },
    });
    if (!rec) throw new NotFoundException('Allowance not found');
    return (this.prisma as any).payrollAllowance.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.isTaxable !== undefined && { isTaxable: dto.isTaxable }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.effectiveDate !== undefined && {
          effectiveDate: new Date(dto.effectiveDate),
        }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteAllowance(companyId: number, id: number) {
    const rec = await (this.prisma as any).payrollAllowance.findFirst({
      where: { id, companyId },
    });
    if (!rec) throw new NotFoundException('Allowance not found');
    return (this.prisma as any).payrollAllowance.delete({ where: { id } });
  }

  // Bonuses
  async getBonuses(
    companyId: number,
    filters?: { employeeId?: number; type?: string; isActive?: string },
  ) {
    const where: any = { companyId };
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined && filters.isActive !== '')
      where.isActive = filters.isActive === 'true';
    return (this.prisma as any).payrollBonus.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async createBonus(
    companyId: number,
    dto: {
      employeeId: number;
      type: string;
      amount: number;
      reason?: string;
      effectiveDate: string;
      expiryDate?: string;
    },
  ) {
    const emp = await (this.prisma as any).employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    if (dto.amount <= 0)
      throw new BadRequestException('Amount must be positive');
    return (this.prisma as any).payrollBonus.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
        effectiveDate: new Date(dto.effectiveDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });
  }

  async updateBonus(companyId: number, id: number, dto: any) {
    const rec = await (this.prisma as any).payrollBonus.findFirst({
      where: { id, companyId },
    });
    if (!rec) throw new NotFoundException('Bonus not found');
    return (this.prisma as any).payrollBonus.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.effectiveDate !== undefined && {
          effectiveDate: new Date(dto.effectiveDate),
        }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteBonus(companyId: number, id: number) {
    const rec = await (this.prisma as any).payrollBonus.findFirst({
      where: { id, companyId },
    });
    if (!rec) throw new NotFoundException('Bonus not found');
    return (this.prisma as any).payrollBonus.delete({ where: { id } });
  }

  // Withholdings
  async getWithholdings(
    companyId: number,
    filters?: {
      employeeId?: number;
      type?: string;
      isActive?: string;
      isGlobal?: string;
    },
  ) {
    const where: any = { companyId };
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.type) where.type = filters.type;
    if (filters?.isActive !== undefined && filters.isActive !== '')
      where.isActive = filters.isActive === 'true';
    if (filters?.isGlobal !== undefined && filters.isGlobal !== '')
      where.isGlobal = filters.isGlobal === 'true';
    return (this.prisma as any).payrollWithholding.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async createWithholding(
    companyId: number,
    dto: {
      employeeId?: number; // null/undefined = GLOBAL (company-wide)
      name?: string; // custom free-text label
      type: string;
      amount: number;
      calcType?: 'FIXED' | 'PERCENTAGE';
      isGlobal?: boolean;
      reason: string;
      effectiveDate: string;
      expiryDate?: string;
    },
  ) {
    if (dto.amount <= 0)
      throw new BadRequestException('Amount must be positive');
    if (!dto.reason?.trim())
      throw new BadRequestException(
        'A custom reason is required for every withholding',
      );

    const isGlobal = dto.isGlobal ?? !dto.employeeId;
    if (!isGlobal && dto.employeeId) {
      const emp = await (this.prisma as any).employee.findFirst({
        where: { id: dto.employeeId, companyId },
      });
      if (!emp) throw new NotFoundException('Employee not found');
    }

    return (this.prisma as any).payrollWithholding.create({
      data: {
        companyId,
        employeeId: isGlobal ? null : (dto.employeeId ?? null),
        name: dto.name?.trim() || 'Withholding',
        type: dto.type,
        amount: dto.amount,
        calcType: dto.calcType || 'FIXED',
        isGlobal,
        reason: dto.reason,
        effectiveDate: new Date(dto.effectiveDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });
  }

  async updateWithholding(companyId: number, id: number, dto: any) {
    const rec = await (this.prisma as any).payrollWithholding.findFirst({
      where: { id, companyId },
    });
    if (!rec) throw new NotFoundException('Withholding not found');
    return (this.prisma as any).payrollWithholding.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.effectiveDate !== undefined && {
          effectiveDate: new Date(dto.effectiveDate),
        }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteWithholding(companyId: number, id: number) {
    const rec = await (this.prisma as any).payrollWithholding.findFirst({
      where: { id, companyId },
    });
    if (!rec) throw new NotFoundException('Withholding not found');
    return (this.prisma as any).payrollWithholding.delete({ where: { id } });
  }
}
