import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeasuringUnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.measuringUnit.findMany();
  }

  async create(name: string) {
    return this.prisma.measuringUnit.create({ data: { name } });
  }
}
