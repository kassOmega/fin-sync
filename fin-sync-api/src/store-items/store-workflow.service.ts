import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreWorkflowService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

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

  // 1. Staff member requests an item (with availability check + reservation)
  async createRequest(
    companyId: number,
    userId: number,
    itemId: number,
    quantity: number,
    projectId?: number,
  ) {
    const item = await this.prisma.storeItem.findFirst({
      where: { id: itemId, companyId },
    });
    if (!item) throw new NotFoundException('Item not found');

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    // Gap 2: Stock availability check at submission time
    const available = item.quantity - item.reservedQuantity;
    if (quantity > available) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${available} ${item.unit}, Requested: ${quantity}`,
      );
    }

    // Create request and reserve quantity in a transaction
    const request = await this.prisma.$transaction(async (prisma) => {
      const req = await prisma.storeRequest.create({
        data: {
          itemId,
          companyId,
          userId,
          quantity,
          status: 'PENDING',
          projectId: projectId ?? null,
        },
      });

      // Reserve stock
      await prisma.storeItem.update({
        where: { id: itemId },
        data: { reservedQuantity: { increment: quantity } },
      });

      return req;
    });

    return request;
  }

  // 2. Approve the request (permission-guard enforced — no hardcoded Owner role)
  async approveRequest(requestId: number) {
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

  // 3. Reject the request (permission-guard enforced — no hardcoded Owner role)
  async rejectRequest(requestId: number) {
    const request = await this.prisma.storeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Request is already processed');

    return this.prisma.$transaction(async (prisma) => {
      // Release reservation
      await prisma.storeItem.update({
        where: { id: request.itemId },
        data: { reservedQuantity: { decrement: request.quantity } },
      });

      return prisma.storeRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });
    });
  }

  // 4. Storekeeper issues the item (with ledger integration + partial fulfillment)
  async issueItem(requestId: number, user: any, quantity?: number) {
    if (
      user.role !== SystemRole.Storekeeper &&
      user.role !== SystemRole.Owner
    ) {
      throw new ForbiddenException('Only storekeepers can issue items');
    }

    const request = await this.prisma.storeRequest.findUnique({
      where: { id: requestId },
      include: { item: true, project: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'APPROVED')
      throw new BadRequestException('Request must be approved first');

    // Determine issue quantity (partial or full)
    const issueQty = quantity ?? request.quantity;
    const remainingToIssue = request.quantity - request.issuedQuantity;

    if (issueQty <= 0) {
      throw new BadRequestException('Issue quantity must be positive');
    }
    if (issueQty > remainingToIssue) {
      throw new BadRequestException(
        `Cannot issue ${issueQty}. Remaining to issue: ${remainingToIssue}`,
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      const item = await prisma.storeItem.findUnique({
        where: { id: request.itemId },
      });
      if (!item)
        throw new BadRequestException('Item no longer exists in inventory');

      const available = item.quantity - item.reservedQuantity;
      if (issueQty > item.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      const unitCost = item.costPrice || 0;
      const totalCost = issueQty * unitCost;

      // Deduct from inventory (actual stock)
      await prisma.storeItem.update({
        where: { id: item.id },
        data: {
          quantity: { decrement: issueQty },
          reservedQuantity: { decrement: issueQty },
        },
      });

      // Create StoreTransaction with cost + ledger linkage
      const tx = await prisma.storeTransaction.create({
        data: {
          itemId: item.id,
          companyId: request.companyId,
          type: 'ISSUE',
          quantity: issueQty,
          issuedToUserId: request.userId,
          issuedById: user.id,
          unitCost,
          totalCost,
          projectId: request.projectId,
          note: `Issued from request #${request.id}`,
        },
      });

      // Update request tracking
      const newIssuedQty = request.issuedQuantity + issueQty;
      const isFullyIssued = newIssuedQty >= request.quantity;
      const updatedRequest = await prisma.storeRequest.update({
        where: { id: requestId },
        data: {
          issuedQuantity: newIssuedQty,
          issuedById: user.id,
          issuedAt: new Date(),
          status: isFullyIssued ? 'ISSUED' : 'APPROVED',
        },
      });

      // Gap 1: Post journal entry for the issuance
      if (totalCost > 0) {
        try {
          // Consumable → COGS; Tool → Equipment asset
          const debitCode = item.isTool ? '1510' : '5001';
          const entry = await this.ledger.createAutoEntry(
            request.companyId,
            {
              sourceType: 'STORE_ISSUE',
              sourceId: requestId,
              description: `Store issue: ${item.name} (${issueQty} ${item.unit})`,
              date: new Date(),
              projectId: request.projectId ?? undefined,
              lines: [
                {
                  accountCode: debitCode,
                  description: item.isTool
                    ? 'Machinery & Equipment'
                    : 'COGS - Materials',
                  debit: totalCost,
                  credit: 0,
                },
                {
                  accountCode: '1201',
                  description: 'Inventory - Raw Materials',
                  debit: 0,
                  credit: totalCost,
                },
              ],
            },
            user.id,
          );

          // Link entry to transaction
          if (entry?.id) {
            await prisma.storeTransaction.update({
              where: { id: tx.id },
              data: { ledgerEntryId: entry.id },
            });
          }
        } catch {
          // Journal creation should not block the issuance
        }
      }

      return updatedRequest;
    });
  }
}
