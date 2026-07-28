import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { StoreWorkflowService } from './store-workflow.service';

/**
 * Standalone controller for store requests that does NOT require a companyId param.
 * Used by the /dashboard/requisitions page for cross-company request management.
 */
@Controller('store-requests')
@UseGuards(RolesGuard)
export class StoreRequestsController {
  constructor(private readonly workflowService: StoreWorkflowService) {}

  // Owner: get ALL requests across all companies
  @Get('all')
  @Roles(SystemRole.Owner)
  getAllRequests() {
    return this.workflowService.getAllRequests();
  }

  // Any staff: get their own requests across all companies
  @Get('my')
  getMyRequests(@CurrentUser('id') userId: number) {
    return this.workflowService.getMyRequests(userId);
  }

  // Staff: create a new request (needs companyId in body)
  @Post()
  @Roles(
    SystemRole.Owner,
    SystemRole.Cashier,
    SystemRole.Sales,
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
  )
  createRequest(
    @CurrentUser() user: any,
    @Body() body: { companyId: number; itemId: number; quantity: number },
  ) {
    return this.workflowService.createRequest(
      body.companyId,
      user.id,
      body.itemId,
      body.quantity,
    );
  }

  // Owner: approve a request
  @Patch(':id/approve')
  @Roles(SystemRole.Owner)
  approveRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.workflowService.approveRequest(id, user);
  }

  // Owner: reject a request
  @Patch(':id/reject')
  @Roles(SystemRole.Owner)
  rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.workflowService.rejectRequest(id, user);
  }

  // Storekeeper/Owner: issue an approved request
  @Patch(':id/issue')
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
  issueItem(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.workflowService.issueItem(id, user);
  }
}
