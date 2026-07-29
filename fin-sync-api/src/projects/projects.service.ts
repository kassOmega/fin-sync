import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        companyId,
        progress: dto.progress || 0,
      },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.project.findMany({ where: { companyId } });
  }

  // Project Manager/Foreman sees only projects assigned to them
  async findMyProjects(companyId: number, userId: number) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT p.*, json_agg(json_build_object(
        'id', pa.id, 'userId', pa.user_id,
        'user', json_build_object('id', u.id, 'name', u.name)
      )) FILTER (WHERE pa.id IS NOT NULL) AS assignments
       FROM finsync."Project" p
       INNER JOIN finsync."ProjectAssignment" pa ON pa.project_id = p.id
       LEFT JOIN finsync."User" u ON u.id = pa.user_id
       WHERE p.company_id = ${companyId} AND pa.user_id = ${userId}
       GROUP BY p.id`,
    );

    return rows.map((row) => ({
      ...row,
      assignments: row.assignments || [],
    }));
  }

  async update(id: number, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.project.delete({ where: { id } });
  }

  async assignUser(projectId: number, userId: number) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync."ProjectAssignment" (project_id, user_id, "createdAt")
       VALUES (${projectId}, ${userId}, NOW())
       ON CONFLICT (project_id, user_id) DO NOTHING`,
    );
    return { projectId, userId, assigned: true };
  }

  async unassignUser(projectId: number, userId: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync."ProjectAssignment"
       WHERE project_id = ${projectId} AND user_id = ${userId}`,
    );
    return { projectId, userId, unassigned: true };
  }
}
