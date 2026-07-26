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
}
