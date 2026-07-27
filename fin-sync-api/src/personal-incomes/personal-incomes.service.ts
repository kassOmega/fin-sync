import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalIncomeDto } from './dto/create-personal-income.dto';

@Injectable()
export class PersonalIncomesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePersonalIncomeDto, userId: number) {
    return this.prisma.$transaction(async (prisma) => {
      const income = await prisma.personalIncome.create({
        data: {
          amount: dto.amount,
          category: dto.category ?? '',
          note: dto.note,
          date: dto.date ? new Date(dto.date) : new Date(),
          accountId: dto.accountId || null,
          userId,
        },
      });

      // If an account is selected, increment its balance
      if (income.accountId) {
        await prisma.personalAccount.update({
          where: { id: income.accountId },
          data: { balance: { increment: income.amount } },
        });
      }

      return income;
    });
  }

  async findAll(userId: number) {
    return this.prisma.personalIncome.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: number, userId: number) {
    const income = await this.prisma.personalIncome.findFirst({
      where: { id, userId },
    });
    if (!income) throw new NotFoundException('Income not found');

    // Reverse account balance if it was linked
    if (income.accountId) {
      await this.prisma.personalAccount.update({
        where: { id: income.accountId },
        data: { balance: { decrement: income.amount } },
      });
    }

    return this.prisma.personalIncome.delete({ where: { id } });
  }
}
