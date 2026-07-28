import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';

@Injectable()
export class SavingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateSavingDto, userId: number) {
    const saving = await this.prisma.personalSaving.create({
      data: {
        ...dto,
        currentAmount: 0,
        startDate: new Date(dto.startDate),
        userId,
      },
    });

    await this.notifications.notifyUser(
      userId,
      '🎯 Savings Goal Created',
      `New savings goal of $${dto.targetAmount} created (${dto.frequency.toLowerCase()} threshold: $${dto.thresholdAmount}).`,
    );

    return saving;
  }

  async findAll(userId: number) {
    return this.prisma.personalSaving.findMany({ where: { userId } });
  }

  async update(id: number, dto: UpdateSavingDto, userId: number) {
    const saving = await this.prisma.personalSaving.findFirst({
      where: { id, userId },
    });
    if (!saving) throw new NotFoundException('Saving goal not found');

    const updated = await this.prisma.personalSaving.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });

    // Check if goal reached
    if (
      updated.currentAmount >= updated.targetAmount &&
      saving.currentAmount < saving.targetAmount
    ) {
      await this.notifications.notifyUser(
        userId,
        '🎉 Savings Goal Reached!',
        `Congratulations! You've reached your savings goal of $${updated.targetAmount.toLocaleString()}.`,
      );
    }

    return updated;
  }

  async remove(id: number, userId: number) {
    const saving = await this.prisma.personalSaving.findFirst({
      where: { id, userId },
    });
    if (!saving) throw new NotFoundException('Saving goal not found');
    return this.prisma.personalSaving.delete({ where: { id } });
  }
}
