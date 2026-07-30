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
    return this.prisma.project.findMany({
      where: { companyId },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
        members: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                designation: true,
                userId: true,
              },
            },
          },
        },
      },
    });
  }

  // Project Manager/Foreman sees only projects assigned to them
  async findMyProjects(companyId: number, userId: number) {
    // First find the employee record for this user
    const empRows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.employees WHERE "userId" = ${userId} AND "companyId" = ${companyId} LIMIT 1`,
    );

    if (!empRows.length) return [];

    const employeeId = empRows[0].id;

    // Find projects where this employee is either a member or manager
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT DISTINCT p.*,
        json_build_object('id', m.id, 'firstName', m."firstName", 'lastName', m."lastName") AS manager,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pm.id,
            'employee', json_build_object(
              'id', e.id, 'firstName', e."firstName", 'lastName', e."lastName",
              'employeeCode', e."employeeCode", 'designation', e.designation
            ),
            'roleOnSite', pm."roleOnSite",
            'assignedAt', pm."assignedAt"
          ))
           FROM finsync."project_members" pm
           JOIN finsync.employees e ON e.id = pm."employeeId"
           WHERE pm."projectId" = p.id
          ), '[]'::json
        ) AS members
       FROM finsync.projects p
       LEFT JOIN finsync.employees m ON m.id = p."managerId"
       LEFT JOIN finsync."project_members" pm ON pm."projectId" = p.id
       WHERE p."companyId" = ${companyId}
         AND (p."managerId" = ${employeeId} OR pm."employeeId" = ${employeeId})
       ORDER BY p.name`,
    );

    return rows;
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

  // Assign an employee to a project
  async assignEmployee(projectId: number, employeeId: number) {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO finsync."project_members" ("projectId", "employeeId", "assignedAt")
       VALUES (${projectId}, ${employeeId}, NOW())
       ON CONFLICT ("projectId", "employeeId") DO NOTHING`,
    );
    return { projectId, employeeId, assigned: true };
  }

  // Unassign an employee from a project
  async unassignEmployee(projectId: number, employeeId: number) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM finsync."project_members"
       WHERE "projectId" = ${projectId} AND "employeeId" = ${employeeId}`,
    );
    return { projectId, employeeId, unassigned: true };
  }

  // Set project manager
  async setManager(projectId: number, employeeId: number) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.projects SET "managerId" = ${employeeId} WHERE id = ${projectId}`,
    );
    return { projectId, managerId: employeeId };
  }

  // Remove project manager
  async removeManager(projectId: number) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE finsync.projects SET "managerId" = NULL WHERE id = ${projectId}`,
    );
    return { projectId, managerId: null };
  }
}
