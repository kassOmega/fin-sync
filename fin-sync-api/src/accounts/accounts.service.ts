import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateAccountDto) {
    // Check code uniqueness within company
    const existing = await this.prisma.account.findFirst({
      where: { companyId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Account code "${dto.code}" already exists for this company`,
      );
    }

    return this.prisma.account.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        type: dto.type as any,
        category: dto.category,
        normalSide: (dto.normalSide as any) || 'DEBIT',
        parentId: dto.parentId ?? null,
        isActive: dto.isActive ?? true,
        description: dto.description,
      },
    });
  }

  /**
   * Return the full list of supported Account Types (data-driven from the
   * Prisma enum) plus any custom categories already in use by the company.
   * This keeps the account-create/edit type dropdown dynamic — administrators
   * can add custom classification labels via the free-form `category` field.
   */
  async getAccountTypes(companyId: number) {
    // Read the actual AccountType enum values straight from Postgres
    // (fully data-driven — the DB is the source of truth, no hardcoding)
    const enumRows: { enumlabel: string }[] = await this.prisma.$queryRawUnsafe(
      `SELECT e.enumlabel
       FROM pg_type t
       JOIN pg_enum e ON t.oid = e.enumtypid
       JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'finsync' AND t.typname = 'AccountType'
       ORDER BY e.enumsortorder`,
    );
    const custom = await this.prisma.account.findMany({
      where: { companyId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return {
      types: enumRows.map((r) => ({ value: r.enumlabel, label: r.enumlabel })),
      customCategories: custom.map((a) => a.category).filter(Boolean),
    };
  }

  async findAll(
    companyId: number,
    options?: { type?: string; search?: string; isActive?: string },
  ) {
    const where: any = { companyId };
    if (options?.type) {
      where.type = options.type;
    }
    if (options?.search) {
      where.OR = [
        { code: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ];
    }
    if (options?.isActive) {
      where.isActive = options.isActive === 'true';
    }

    return this.prisma.account.findMany({
      where,
      include: {
        children: {
          select: { id: true, code: true, name: true, type: true },
        },
        parent: {
          select: { id: true, code: true, name: true },
        },
        _count: { select: { journalLines: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(companyId: number, id: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, companyId },
      include: {
        children: {
          select: { id: true, code: true, name: true, type: true },
        },
        parent: {
          select: { id: true, code: true, name: true },
        },
        _count: { select: { journalLines: true } },
      },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async update(companyId: number, id: number, dto: UpdateAccountDto) {
    await this.findOne(companyId, id);

    return this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.normalSide !== undefined && {
          normalSide: dto.normalSide as any,
        }),
        ...(dto.parentId !== undefined && {
          parentId: dto.parentId ?? null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
      },
    });
  }

  async remove(companyId: number, id: number) {
    const account = await this.findOne(companyId, id);

    // Prevent deletion if journal lines exist
    const lineCount = await this.prisma.journalLine.count({
      where: { accountId: id },
    });
    if (lineCount > 0) {
      throw new ConflictException(
        'Cannot delete account with existing journal entries. Deactivate it instead.',
      );
    }

    // Prevent deletion if it has child accounts
    const childCount = await this.prisma.account.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new ConflictException(
        'Cannot delete account with child accounts. Remove children first.',
      );
    }

    return this.prisma.account.delete({ where: { id } });
  }

  async getTree(companyId: number) {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: 'asc' },
    });

    // Build tree structure
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const acc of accounts) {
      map.set(acc.id, { ...acc, children: [] });
    }

    for (const acc of accounts) {
      const node = map.get(acc.id);
      if (acc.parentId && map.has(acc.parentId)) {
        map.get(acc.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
