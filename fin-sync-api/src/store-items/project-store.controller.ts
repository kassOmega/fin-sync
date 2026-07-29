import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { StoreItemsService } from './store-items.service';
import { StoreWorkflowService } from './store-workflow.service';

@Controller('companies/:companyId/projects/:projectId/store')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectStoreController {
  constructor(
    private readonly service: StoreItemsService,
    private readonly workflowService: StoreWorkflowService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.STORE_READ)
  findAll(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.findAll(companyId);
  }

  @Get('categories')
  getCategories(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCategories(companyId);
  }

  @Get('requests')
  @RequirePermissions(PermissionCode.STORE_REQUEST_CREATE)
  getRequests(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.workflowService.getRequests(companyId);
  }

  @Post('requests')
  @RequirePermissions(PermissionCode.STORE_REQUEST_CREATE)
  createRequest(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() body: { itemId: number; quantity: number; note?: string },
    @CurrentUser('id') userId: number,
  ) {
    return this.workflowService.createRequest(
      companyId,
      userId,
      body.itemId,
      body.quantity,
    );
  }
}
