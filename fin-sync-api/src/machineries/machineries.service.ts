import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';

@Injectable()
export class MachineriesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateMachineryDto) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync.machineries ("companyId", name, code, type, status, "projectId", "created_at", "updated_at")
       VALUES (${companyId}, '${dto.name}', ${dto.code ? `'${dto.code}'` : 'NULL'}, '${dto.type || 'OTHER'}', '${dto.status || 'AVAILABLE'}', ${dto.projectId ?? 'NULL'}, NOW(), NOW())`,
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.machineries ORDER BY id DESC LIMIT 1`,
    );
    return rows[0];
  }

  async findAll(companyId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT m.* FROM finsync.machineries m WHERE m."companyId" = ${companyId} ORDER BY m.name`,
    );
  }

  async findByProject(projectId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT m.* FROM finsync.machineries m WHERE m."projectId" = ${projectId} ORDER BY m.name`,
    );
  }

  async findMyMachines(companyId: number, userId: number) {
    return this.prisma.$queryRawUnsafe(
      `SELECT m.* FROM finsync.machineries m
       WHERE m."companyId" = ${companyId} AND m."operatorId" IN (
         SELECT id FROM finsync.employees WHERE user_id = ${userId}
       )
       ORDER BY m.name`,
    );
  }

  async update(id: number, dto: UpdateMachineryDto) {
    const sets: string[] = ['"updated_at" = NOW()'];
    if (dto.name) sets.push(`name = '${dto.name}'`);
    if (dto.category) sets.push(`category = '${dto.category}'`);
    if (dto.status) sets.push(`status = '${dto.status}'`);
    if (dto.type) sets.push(`type = '${dto.type}'`);
    if (dto.code !== undefined)
      sets.push(`code = ${dto.code ? `'${dto.code}'` : 'NULL'}`);
    if (dto.projectId !== undefined)
      sets.push(`"projectId" = ${dto.projectId ?? 'NULL'}`);
    if (dto.ownershipType)
      sets.push(`"ownershipType" = '${dto.ownershipType}'`);

    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET ${sets.join(', ')} WHERE id = ${id}`,
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM finsync.machineries WHERE id = ${id}`,
    );
    if (!rows.length) throw new NotFoundException('Machinery not found');
    return rows[0];
  }

  async remove(id: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync.machineries WHERE id = ${id}`,
    );
    return { id, deleted: true };
  }

  async assignOperator(machineryId: number, userId: number) {
    const empRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.employees WHERE user_id = ${userId} LIMIT 1`,
    );
    if (!empRows.length)
      throw new NotFoundException('Employee record not found for this user');
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.machineries SET "operatorId" = ${empRows[0].id} WHERE id = ${machineryId}`,
    );
    return { machineryId, operatorId: empRows[0].id };
  }
}
