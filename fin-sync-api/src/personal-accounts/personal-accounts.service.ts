import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalAccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.personalAccount.findMany({ where: { userId } });
  }

  async create(userId: number, dto: { name: string; balance: number }) {
    return this.prisma.personalAccount.create({
      data: { ...dto, userId, balance: dto.balance || 0 },
    });
  }

  async update(
    id: number,
    userId: number,
    dto: { name?: string; balance?: number },
  ) {
    const acc = await this.prisma.personalAccount.findFirst({
      where: { id, userId },
    });
    if (!acc) throw new NotFoundException('Account not found');
    return this.prisma.personalAccount.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    const acc = await this.prisma.personalAccount.findFirst({
      where: { id, userId },
    });
    if (!acc) throw new NotFoundException('Account not found');
    return this.prisma.personalAccount.delete({ where: { id } });
  }

  async getTransfers(userId: number) {
    return this.prisma.accountTransfer.findMany({
      where: { userId },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { date: 'desc' },
      take: 20,
    });
  }

  // Transfer logic
  async transfer(
    userId: number,
    dto: {
      fromAccountId: number;
      toAccountId: number;
      amount: number;
      note?: string;
    },
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create the transfer record
      await prisma.accountTransfer.create({
        data: { ...dto, userId },
      });

      // 2. Decrement from account
      await prisma.personalAccount.update({
        where: { id: dto.fromAccountId },
        data: { balance: { decrement: dto.amount } },
      });

      // 3. Increment to account
      await prisma.personalAccount.update({
        where: { id: dto.toAccountId },
        data: { balance: { increment: dto.amount } },
      });

      return { message: 'Transfer successful' };
    });
  }
}
