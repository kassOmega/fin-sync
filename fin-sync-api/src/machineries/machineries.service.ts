import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';

@Injectable()
export class MachineriesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateMachineryDto) {
    return this.prisma.machinery.create({
      data: { ...dto, companyId, status: dto.status || 'IDLE' },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.machinery.findMany({
      where: { companyId },
      include: {
        operators: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  }

  async update(id: number, dto: UpdateMachineryDto) {
    const machine = await this.prisma.machinery.findUnique({ where: { id } });
    if (!machine) throw new NotFoundException('Machinery not found');
    return this.prisma.machinery.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const machine = await this.prisma.machinery.findUnique({ where: { id } });
    if (!machine) throw new NotFoundException('Machinery not found');
    return this.prisma.machinery.delete({ where: { id } });
  }

  async assignOperator(
    machineryId: number,
    userId: number,
    isHelper: boolean = false,
  ) {
    return this.prisma.machineryOperator.create({
      data: { machineryId, userId, isHelper },
    });
  }
}
