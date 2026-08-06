import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a store. Company-level or project-scoped.
   */
  async create(companyId: number, dto: CreateStoreDto, userId: number) {
    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId },
      });
      if (!project)
        throw new NotFoundException('Project not found in this company');
    }

    if (dto.storekeeperId) {
      const member = await this.prisma.companyMember.findFirst({
        where: { userId: dto.storekeeperId, companyId },
      });
      if (!member)
        throw new ForbiddenException(
          'Storekeeper must be a member of this company',
        );
    }

    return this.prisma.store.create({
      data: {
        name: dto.name,
        companyId,
        projectId: dto.projectId ?? null,
        storekeeperId: dto.storekeeperId ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
      include: {
        storekeeper: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(companyId: number, projectId?: number) {
    const where: any = { companyId };
    if (projectId !== undefined) where.projectId = projectId;

    return this.prisma.store.findMany({
      where,
      include: {
        storekeeper: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
      include: {
        storekeeper: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, managerId: true } },
        _count: { select: { items: true } },
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(
    companyId: number,
    storeId: number,
    dto: UpdateStoreDto,
  ) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
    });
    if (!store) throw new NotFoundException('Store not found');

    if (dto.storekeeperId) {
      const member = await this.prisma.companyMember.findFirst({
        where: { userId: dto.storekeeperId, companyId },
      });
      if (!member)
        throw new ForbiddenException(
          'Storekeeper must be a member of this company',
        );
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        name: dto.name ?? store.name,
        storekeeperId:
          dto.storekeeperId !== undefined
            ? dto.storekeeperId
            : store.storekeeperId,
        description:
          dto.description !== undefined ? dto.description : store.description,
        isActive: dto.isActive !== undefined ? dto.isActive : store.isActive,
      },
      include: {
        storekeeper: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(companyId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
    });
    if (!store) throw new NotFoundException('Store not found');

    const itemCount = await this.prisma.storeItem.count({
      where: { storeId },
    });
    if (itemCount > 0)
      throw new ForbiddenException(
        'Cannot delete a store with existing items. Transfer or remove items first.',
      );

    return this.prisma.store.delete({ where: { id: storeId } });
  }

  async assertStorekeeper(storeId: number, userId: number, userRole: string) {
    if (userRole === 'Owner') return;

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { storekeeperId: true },
    });
    if (!store) throw new NotFoundException('Store not found');

    if (store.storekeeperId !== userId) {
      throw new ForbiddenException(
        'Only the storekeeper assigned to this store can perform this action',
      );
    }
  }

  async canApproveForStore(
    storeId: number,
    userId: number,
    userRole: string,
  ): Promise<boolean> {
    if (userRole === 'Owner') return true;

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        project: {
          select: {
            managerId: true,
            manager: { select: { userId: true } },
          },
        },
      },
    });

    if (!store) return false;

    if (store.projectId && store.project?.manager?.userId === userId) {
      return true;
    }

    return false;
  }
}
