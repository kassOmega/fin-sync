import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionCode } from '../common/constants/permission-codes';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { StoreTransactionDto } from './dto/store-transaction.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';
import { StoreItemsService } from './store-items.service';
import { StoreWorkflowService } from './store-workflow.service';

@Controller('companies/:companyId/store-items')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StoreItemsController {
  constructor(
    private readonly service: StoreItemsService,
    private readonly workflowService: StoreWorkflowService,
  ) {}

  // --- Literal path routes must come BEFORE parameterized :id routes ---

  @Post()
  @RequirePermissions(PermissionCode.STORE_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateStoreItemDto,
  ) {
    return this.service.create(companyId, dto);
  }

  // --- Category Management ---
  @Get('categories')
  getCategories(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getCategories(companyId);
  }

  @Post('categories')
  @RequirePermissions(PermissionCode.STORE_WRITE)
  createCategory(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: { name: string },
  ) {
    return this.service.createCategory(companyId, dto.name);
  }

  // --- Request Management ---
  @Get('requests')
  getRequests(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.workflowService.getRequests(companyId);
  }

  @Post('requests')
  @RequirePermissions(PermissionCode.STORE_REQUEST_CREATE)
  createRequest(
    @Param('companyId', ParseIntPipe) companyId: number,
    @CurrentUser() user: any,
    @Body() body: { itemId: number; quantity: number },
  ) {
    return this.workflowService.createRequest(
      companyId,
      user.id,
      body.itemId,
      body.quantity,
    );
  }

  @Patch('requests/:id/approve')
  @RequirePermissions(PermissionCode.STORE_REQUEST_APPROVE)
  approveRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.workflowService.approveRequest(id, user);
  }

  @Patch('requests/:id/reject')
  @RequirePermissions(PermissionCode.STORE_REQUEST_APPROVE)
  rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.workflowService.rejectRequest(id, user);
  }

  @Patch('requests/:id/issue')
  @RequirePermissions(PermissionCode.STORE_REQUEST_ISSUE)
  issueItem(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.workflowService.issueItem(id, user);
  }

  @Patch('requests/:id/return')
  @RequirePermissions(PermissionCode.STORE_WRITE)
  returnItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    return this.service.returnItem(id, user, companyId);
  }

  // --- Parameterized :id routes come AFTER all literal paths ---

  @Get()
  @RequirePermissions(PermissionCode.STORE_READ)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.findAll(
      companyId,
      categoryId ? parseInt(categoryId) : undefined,
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.STORE_WRITE)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreItemDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.STORE_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/transaction')
  @RequirePermissions(PermissionCode.STORE_TRANSACTION)
  handleTransaction(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StoreTransactionDto,
  ) {
    return this.service.handleTransaction(id, dto, companyId);
  }
}
