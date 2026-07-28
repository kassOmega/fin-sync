import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreWorkflowService {
  constructor(private prisma: PrismaService) {}

  // Get requests for a specific company
  async getRequests(companyId: number) {
    return this.prisma.storeRequest.findMany({
      where: { companyId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            isTool: true,
          },
        },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get all requests across ALL companies (Owner view for /dashboard/requisitions)
  async getAllRequests() {
    return this.prisma.storeRequest.findMany({
      include: {
        item: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            isTool: true,
          },
        },
        user: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get current user's own requests across all companies
  async getMyRequests(userId: number) {
    return this.prisma.storeRequest.findMany({
      where: { userId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            isTool: true,
          },
        },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 1. Staff member requests an item
  async createRequest(
    companyId: number,
    userId: number,
    itemId: number,
    quantity: number,
  ) {
    const item = await this.prisma.storeItem.findFirst({
      where: { id: itemId, companyId },
    });
    if (!item) throw new NotFoundException('Item not found');

    return this.prisma.storeRequest.create({
      data: { itemId, companyId, userId, quantity, status: 'PENDING' },
    });
  }

  // 2. Owner Approves the request
  async approveRequest(requestId: number, user: any) {
    if (user.role !== SystemRole.Owner)
      throw new ForbiddenException('Only owners can approve requests');

    const request = await this.prisma.storeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Request is already processed');

    return this.prisma.storeRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });
  }

  // 3. Owner rejects the request
  async rejectRequest(requestId: number, user: any) {
    if (user.role !== SystemRole.Owner)
      throw new ForbiddenException('Only owners can reject requests');

    const request = await this.prisma.storeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Request is already processed');

    return this.prisma.storeRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  }

  // 4. Storekeeper issues the item
  //   - Consumables: permanent stock deduction, status → ISSUED (no return)
  //   - Tools: stock deduction + tracked issuance, status → ISSUED (returnable)
  async issueItem(requestId: number, user: any) {
    if (
      user.role !== SystemRole.Storekeeper &&
      user.role !== SystemRole.Owner
    ) {
      throw new ForbiddenException('Only storekeepers can issue items');
    }

    const request = await this.prisma.storeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'APPROVED')
      throw new BadRequestException('Request must be approved first');

    return this.prisma.$transaction(async (prisma) => {
      const item = await prisma.storeItem.findUnique({
        where: { id: request.itemId },
      });
      if (!item)
        throw new BadRequestException('Item no longer exists in inventory');

      if (item.quantity < request.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      // Deduct from inventory
      await prisma.storeItem.update({
        where: { id: item.id },
        data: { quantity: { decrement: request.quantity } },
      });

      // Log the transaction
      await prisma.storeTransaction.create({
        data: {
          itemId: item.id,
          companyId: request.companyId,
          type: 'ISSUE',
          quantity: request.quantity,
          issuedToUserId: request.userId,
        },
      });

      // Mark request as issued
      return prisma.storeRequest.update({
        where: { id: requestId },
        data: { status: 'ISSUED' },
      });
    });
  }
}
