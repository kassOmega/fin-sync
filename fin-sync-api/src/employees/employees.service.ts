import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT e.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email) AS user
       FROM finsync.employees e
       LEFT JOIN finsync."User" u ON u.id = e."userId"
       WHERE e."companyId" = ${companyId}
       ORDER BY e."firstName", e."lastName"`,
    );
    return rows;
  }

  async findOne(id: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT e.*, json_build_object('id', u.id, 'name', u.name, 'email', u.email) AS user
       FROM finsync.employees e
       LEFT JOIN finsync."User" u ON u.id = e."userId"
       WHERE e.id = ${id}`,
    );
    if (!rows.length) throw new NotFoundException('Employee not found');
    return rows[0];
  }

  async create(companyId: number, dto: CreateEmployeeDto) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.employees ("companyId", "employeeCode", "firstName", "lastName", email, phone, designation, "employmentType", "baseSalary", "hourlyRate", "dailyRate", "isActive", "joinedDate", "userId", "created_at", "updatedAt")
       VALUES (${companyId}, '${dto.employeeCode}', '${dto.firstName}', '${dto.lastName}', ${dto.email ? `'${dto.email}'` : 'NULL'}, ${dto.phone ? `'${dto.phone}'` : 'NULL'}, '${dto.designation}', '${dto.employmentType || 'FULL_TIME'}', ${dto.baseSalary ?? 'NULL'}, ${dto.hourlyRate ?? 'NULL'}, ${dto.dailyRate ?? 'NULL'}, ${dto.isActive ?? true}, ${dto.joinedDate ? `'${dto.joinedDate}'` : 'NOW()'}, ${dto.userId ?? 'NULL'}, NOW(), NOW())`,
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.employees ORDER BY id DESC LIMIT 1`,
    );
    return rows[0];
  }

  async update(id: number, dto: Partial<CreateEmployeeDto>) {
    const sets: string[] = ['"updatedAt" = NOW()'];
    if (dto.employeeCode) sets.push(`"employeeCode" = '${dto.employeeCode}'`);
    if (dto.firstName) sets.push(`"firstName" = '${dto.firstName}'`);
    if (dto.lastName) sets.push(`"lastName" = '${dto.lastName}'`);
    if (dto.email !== undefined)
      sets.push(`email = ${dto.email ? `'${dto.email}'` : 'NULL'}`);
    if (dto.phone !== undefined)
      sets.push(`phone = ${dto.phone ? `'${dto.phone}'` : 'NULL'}`);
    if (dto.designation) sets.push(`designation = '${dto.designation}'`);
    if (dto.employmentType)
      sets.push(`"employmentType" = '${dto.employmentType}'`);
    if (dto.baseSalary !== undefined)
      sets.push(`"baseSalary" = ${dto.baseSalary ?? 'NULL'}`);
    if (dto.hourlyRate !== undefined)
      sets.push(`"hourlyRate" = ${dto.hourlyRate ?? 'NULL'}`);
    if (dto.dailyRate !== undefined)
      sets.push(`"dailyRate" = ${dto.dailyRate ?? 'NULL'}`);
    if (dto.isActive !== undefined) sets.push(`"isActive" = ${dto.isActive}`);
    if (dto.joinedDate) sets.push(`"joinedDate" = '${dto.joinedDate}'`);
    if (dto.userId !== undefined)
      sets.push(`"userId" = ${dto.userId ?? 'NULL'}`);

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.employees SET ${sets.join(', ')} WHERE id = ${id}`,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.employees WHERE id = ${id}`,
    );
    return { id, deleted: true };
  }
}
