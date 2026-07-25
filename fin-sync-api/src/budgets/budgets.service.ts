import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBudgetDto, userId: number) {
    return this.prisma.personalBudget.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.personalBudget.findMany({ where: { userId } });
  }

  async update(id: number, dto: UpdateBudgetDto, userId: number) {
    const budget = await this.prisma.personalBudget.findFirst({
      where: { id, userId },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    return this.prisma.personalBudget.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  async remove(id: number, userId: number) {
    const budget = await this.prisma.personalBudget.findFirst({
      where: { id, userId },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return this.prisma.personalBudget.delete({ where: { id } });
  }
}
