import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        ...dto,
        companyId,
        nextPayDate: dto.nextPayDate ? new Date(dto.nextPayDate) : null,
      },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.employee.findMany({ where: { companyId } });
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        nextPayDate: dto.nextPayDate ? new Date(dto.nextPayDate) : undefined,
      },
    });
  }

  async remove(id: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.employee.delete({ where: { id } });
  }
}
