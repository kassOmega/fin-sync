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
import { SystemRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { StoreTransactionDto } from './dto/store-transaction.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';
import { StoreItemsService } from './store-items.service';
import { StoreWorkflowService } from './store-workflow.service';

@Controller('companies/:companyId/store-items')
@UseGuards(RolesGuard)
export class StoreItemsController {
  constructor(
    private readonly service: StoreItemsService,
    private readonly workflowService: StoreWorkflowService,
  ) {}

  // --- Literal path routes must come BEFORE parameterized :id routes ---

  @Post()
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
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
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
  createCategory(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: { name: string },
  ) {
    return this.service.createCategory(companyId, dto.name);
  }

  // --- Request Management ---
  @Get('requests')
  @Roles(
    SystemRole.Owner,
    SystemRole.Storekeeper,
    SystemRole.Cashier,
    SystemRole.Sales,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
  )
  getRequests(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.workflowService.getRequests(companyId);
  }

  @Post('requests')
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
  @Roles(SystemRole.Owner)
  approveRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.workflowService.approveRequest(id, user);
  }

  @Patch('requests/:id/reject')
  @Roles(SystemRole.Owner)
  rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.workflowService.rejectRequest(id, user);
  }

  @Patch('requests/:id/issue')
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
  issueItem(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.workflowService.issueItem(id, user);
  }

  @Patch('requests/:id/return')
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
  returnItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    return this.service.returnItem(id, user, companyId);
  }

  // --- Parameterized :id routes come AFTER all literal paths ---

  @Get()
  @Roles(
    SystemRole.Owner,
    SystemRole.Storekeeper,
    SystemRole.Cashier,
    SystemRole.Sales,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
  )
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
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreItemDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(SystemRole.Owner)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/transaction')
  @Roles(SystemRole.Owner, SystemRole.Storekeeper)
  handleTransaction(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StoreTransactionDto,
  ) {
    return this.service.handleTransaction(id, dto, companyId);
  }
}
