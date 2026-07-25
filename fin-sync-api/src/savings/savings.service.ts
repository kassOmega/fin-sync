import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';

@Injectable()
export class SavingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSavingDto, userId: number) {
    return this.prisma.personalSaving.create({
      data: {
        ...dto,
        currentAmount: 0,
        startDate: new Date(dto.startDate),
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.personalSaving.findMany({ where: { userId } });
  }

  async update(id: number, dto: UpdateSavingDto, userId: number) {
    const saving = await this.prisma.personalSaving.findFirst({
      where: { id, userId },
    });
    if (!saving) throw new NotFoundException('Saving goal not found');

    return this.prisma.personalSaving.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  async remove(id: number, userId: number) {
    const saving = await this.prisma.personalSaving.findFirst({
      where: { id, userId },
    });
    if (!saving) throw new NotFoundException('Saving goal not found');
    return this.prisma.personalSaving.delete({ where: { id } });
  }
}
