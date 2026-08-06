import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreTxType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from './stores.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Injectable()
export class StoreTransfersService {
  constructor(
    private prisma: PrismaService,
    private storesService: StoresService,
  ) {}

  /**
   * Request a transfer between two stores.
   */
  async requestTransfer(dto: CreateTransferDto, userId: number) {
    if (dto.fromStoreId === dto.toStoreId) {
      throw new BadRequestException('Cannot transfer to the same store');
    }
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    // Validate source store and item
    const sourceStore = await this.prisma.store.findUnique({
      where: { id: dto.fromStoreId },
    });
    if (!sourceStore) throw new NotFoundException('Source store not found');

    const item = await this.prisma.storeItem.findFirst({
      where: { id: dto.itemId, storeId: dto.fromStoreId },
    });
    if (!item)
      throw new NotFoundException('Item not found in source store');

    const available = item.quantity - item.reservedQuantity;
    if (dto.quantity > available) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${available} ${item.unit}`,
      );
    }

    // Validate destination store exists
    const destStore = await this.prisma.store.findUnique({
      where: { id: dto.toStoreId },
    });
    if (!destStore)
      throw new NotFoundException('Destination store not found');

    // Reserve quantity in source item
    return this.prisma.$transaction(async (prisma) => {
      await prisma.storeItem.update({
        where: { id: dto.itemId },
        data: { reservedQuantity: { increment: dto.quantity } },
      });

      return prisma.storeTransfer.create({
        data: {
          fromStoreId: dto.fromStoreId,
          toStoreId: dto.toStoreId,
          itemId: dto.itemId,
          quantity: dto.quantity,
          status: 'PENDING',
          requestedById: userId,
          note: dto.note ?? null,
        },
        include: {
          fromStore: { select: { id: true, name: true } },
          toStore: { select: { id: true, name: true } },
          item: { select: { id: true, name: true, unit: true } },
          requestedBy: { select: { id: true, name: true } },
        },
      });
    });
  }

  /**
   * List transfers with filters.
   */
  async findAll(filters: {
    fromStoreId?: number;
    toStoreId?: number;
    status?: string;
    userId?: number;
  }) {
    const where: any = {};
    if (filters.fromStoreId) where.fromStoreId = filters.fromStoreId;
    if (filters.toStoreId) where.toStoreId = filters.toStoreId;
    if (filters.status) where.status = filters.status;

    return this.prisma.storeTransfer.findMany({
      where,
      include: {
        fromStore: { select: { id: true, name: true, companyId: true } },
        toStore: { select: { id: true, name: true, companyId: true } },
        item: { select: { id: true, name: true, unit: true, quantity: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single transfer.
   */
  async findOne(id: number) {
    const transfer = await this.prisma.storeTransfer.findUnique({
      where: { id },
      include: {
        fromStore: {
          select: { id: true, name: true, companyId: true, projectId: true },
        },
        toStore: {
          select: { id: true, name: true, companyId: true, projectId: true },
        },
        item: { select: { id: true, name: true, unit: true, quantity: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  /**
   * Approve a transfer. Owner or project manager can approve.
   */
  async approveTransfer(id: number, userId: number, userRole: string) {
    const transfer = await this.prisma.storeTransfer.findUnique({
      where: { id },
      include: { fromStore: { include: { project: true } } },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'PENDING')
      throw new BadRequestException('Only pending transfers can be approved');

    const canApprove = await this.storesService.canApproveForStore(
      transfer.fromStoreId,
      userId,
      userRole,
    );
    if (!canApprove)
      throw new ForbiddenException('You do not have permission to approve this transfer');

    return this.prisma.storeTransfer.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: userId },
      include: {
        fromStore: { select: { id: true, name: true } },
        toStore: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, unit: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Reject a transfer. Releases reservation.
   */
  async rejectTransfer(id: number, userId: number, userRole: string) {
    const transfer = await this.prisma.storeTransfer.findUnique({
      where: { id },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'PENDING')
      throw new BadRequestException('Only pending transfers can be rejected');

    const canApprove = await this.storesService.canApproveForStore(
      transfer.fromStoreId,
      userId,
      userRole,
    );
    if (!canApprove)
      throw new ForbiddenException('You do not have permission to reject this transfer');

    return this.prisma.$transaction(async (prisma) => {
      await prisma.storeItem.update({
        where: { id: transfer.itemId },
        data: { reservedQuantity: { decrement: transfer.quantity } },
      });

      return prisma.storeTransfer.update({
        where: { id },
        data: { status: 'REJECTED', approvedById: userId },
      });
    });
  }

  /**
   * Complete (execute) a transfer. Destination storekeeper or Owner.
   */
  async completeTransfer(id: number, userId: number, userRole: string) {
    const transfer = await this.prisma.storeTransfer.findUnique({
      where: { id },
      include: {
        fromStore: { select: { id: true, companyId: true } },
        toStore: { select: { id: true, companyId: true } },
        item: {
          select: {
            id: true, name: true, categoryId: true, unit: true,
            costPrice: true, sellingPrice: true, isTool: true,
            lowStockThreshold: true,
          },
        },
      },
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'APPROVED')
      throw new BadRequestException('Only approved transfers can be completed');

    await this.storesService.assertStorekeeper(
      transfer.toStoreId, userId, userRole,
    );

    return this.prisma.$transaction(async (prisma) => {
      await prisma.storeItem.update({
        where: { id: transfer.itemId },
        data: {
          quantity: { decrement: transfer.quantity },
          reservedQuantity: { decrement: transfer.quantity },
        },
      });

      await prisma.storeTransaction.create({
        data: {
          itemId: transfer.itemId,
          companyId: transfer.fromStore.companyId,
          storeId: transfer.fromStoreId,
          type: 'ISSUE' as any,
          quantity: transfer.quantity,
          issuedById: userId,
          unitCost: transfer.item.costPrice,
          totalCost: (transfer.item.costPrice || 0) * transfer.quantity,
          note: `Transfer out to store #${transfer.toStoreId}`,
          status: 'APPROVED',
        },
      });

      let destItem = await prisma.storeItem.findFirst({
        where: { storeId: transfer.toStoreId, name: transfer.item.name },
      });

      let destItemId: number;
      if (destItem) {
        await prisma.storeItem.update({
          where: { id: destItem.id },
          data: { quantity: { increment: transfer.quantity } },
        });
        destItemId = destItem.id;
      } else {
        const newItem = await prisma.storeItem.create({
          data: {
            companyId: transfer.toStore.companyId,
            storeId: transfer.toStoreId,
            name: transfer.item.name,
            categoryId: transfer.item.categoryId,
            quantity: transfer.quantity,
            unit: transfer.item.unit,
            costPrice: transfer.item.costPrice,
            sellingPrice: transfer.item.sellingPrice,
            isTool: transfer.item.isTool,
            lowStockThreshold: transfer.item.lowStockThreshold,
          },
        });
        destItemId = newItem.id;
      }

      await prisma.storeTransaction.create({
        data: {
          itemId: destItemId,
          companyId: transfer.toStore.companyId,
          storeId: transfer.toStoreId,
          type: 'RESTOCK' as any,
          quantity: transfer.quantity,
          issuedById: userId,
          unitCost: transfer.item.costPrice,
          totalCost: (transfer.item.costPrice || 0) * transfer.quantity,
          note: `Transfer in from store #${transfer.fromStoreId}`,
          status: 'APPROVED',
        },
      });

      return prisma.storeTransfer.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: {
          fromStore: { select: { id: true, name: true } },
          toStore: { select: { id: true, name: true } },
          item: { select: { id: true, name: true, unit: true } },
          requestedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      });
    });
  }
}
