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
import { PermissionCode } from '../common/constants/permission-codes';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { StoreWorkflowService } from './store-workflow.service';

/**
 * Standalone controller for store requests that does NOT require a companyId param.
 * Used by the /dashboard/requisitions page for cross-company request management.
 */
@Controller('store-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StoreRequestsController {
  constructor(private readonly workflowService: StoreWorkflowService) {}

  // Owner: get ALL requests across all companies
  @Get('all')
  @RequirePermissions(PermissionCode.STORE_REQUEST_APPROVE)
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
  @RequirePermissions(PermissionCode.STORE_REQUEST_CREATE)
  createRequest(
    @CurrentUser() user: any,
    @Body()
    body: {
      companyId: number;
      itemId: number;
      quantity: number;
      projectId?: number;
    },
  ) {
    return this.workflowService.createRequest(
      body.companyId,
      user.id,
      body.itemId,
      body.quantity,
      body.projectId,
    );
  }

  // Owner: approve a request (permission-guard enforced)
  @Patch(':id/approve')
  @RequirePermissions(PermissionCode.STORE_REQUEST_APPROVE)
  approveRequest(@Param('id', ParseIntPipe) id: number) {
    return this.workflowService.approveRequest(id);
  }

  // Owner: reject a request (permission-guard enforced)
  @Patch(':id/reject')
  @RequirePermissions(PermissionCode.STORE_REQUEST_APPROVE)
  rejectRequest(@Param('id', ParseIntPipe) id: number) {
    return this.workflowService.rejectRequest(id);
  }

  // Storekeeper/Owner: issue an approved request (partial or full)
  @Patch(':id/issue')
  @RequirePermissions(PermissionCode.STORE_REQUEST_ISSUE)
  issueItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() body?: { quantity?: number },
  ) {
    return this.workflowService.issueItem(id, user, body?.quantity);
  }
}
