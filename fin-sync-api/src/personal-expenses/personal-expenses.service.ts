import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalExpenseDto } from './dto/create-personal-expense.dto';
import { UpdatePersonalExpenseDto } from './dto/update-personal-expense.dto';

@Injectable()
export class PersonalExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePersonalExpenseDto, userId: number) {
    return this.prisma.personalExpense.create({
      data: {
        amount: dto.amount,
        category: dto.category,
        note: dto.note,
        isCategorized: dto.isCategorized ?? false,
        date: dto.date ? new Date(dto.date) : new Date(),
        userId,
      },
    });
  }

  async findAll(userId: number, category?: string, isCategorized?: boolean) {
    return this.prisma.personalExpense.findMany({
      where: {
        userId,
        category,
        isCategorized,
      },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: number, dto: UpdatePersonalExpenseDto, userId: number) {
    const expense = await this.prisma.personalExpense.findFirst({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.personalExpense.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: number, userId: number) {
    const expense = await this.prisma.personalExpense.findFirst({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.prisma.personalExpense.delete({ where: { id } });
  }
}
