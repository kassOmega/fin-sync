import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { StoresService } from '../stores/stores.service';
import { StoreTransfersService } from '../stores/store-transfers.service';
import { StoreItemsService } from './store-items.service';
import { StoreWorkflowService } from './store-workflow.service';

@Controller('companies/:companyId/projects/:projectId/store')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectStoreController {
  constructor(
    private readonly service: StoreItemsService,
    private readonly workflowService: StoreWorkflowService,
    private readonly storesService: StoresService,
    private readonly transfersService: StoreTransfersService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.STORE_READ)
  async findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    const stores = await this.storesService.findAll(companyId, projectId);
    const storeIds = stores.map((s) => s.id);
    // Also include company-level stores (no project) so projects can see
    // company inventory to make requests
    const companyStores = await this.storesService.findAll(companyId, undefined);
    const companyStoreIds = companyStores
      .filter((s) => !s.projectId)
      .map((s) => s.id);
    const allIds = [...new Set([...storeIds, ...companyStoreIds])];
    return allIds.length > 0 ? this.service.findByStoreIds(allIds) : [];
  }

  @Get('stores')
  @RequirePermissions(PermissionCode.STORE_READ)
  getStores(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.storesService.findAll(companyId, projectId);
  }

  @Get('categories')
  getCategories(
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    return this.service.getCategories(companyId);
  }

  @Get('requests')
  @RequirePermissions(PermissionCode.STORE_REQUEST_CREATE)
  async getRequests(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    const stores = await this.storesService.findAll(companyId, projectId);
    const storeIds = stores.map((s) => s.id);
    if (storeIds.length === 0) return [];
    return this.workflowService.getRequestsByStoreIds(storeIds);
  }

  @Get('transfers')
  @RequirePermissions(PermissionCode.STORE_READ)
  getTransfers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Query('status') status?: string,
  ) {
    return this.transfersService.findByProject(projectId, status);
  }

  @Post('requests')
  @RequirePermissions(PermissionCode.STORE_REQUEST_CREATE)
  createRequest(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: { itemId: number; quantity: number; note?: string },
    @CurrentUser('id') userId: number,
  ) {
    return this.workflowService.createRequest(
      companyId,
      userId,
      body.itemId,
      body.quantity,
      projectId,
    );
  }
}
