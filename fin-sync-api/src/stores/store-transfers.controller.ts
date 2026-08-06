import {
  Body,
  Controller,
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
import { CreateTransferDto } from './dto/create-transfer.dto';
import { StoreTransfersService } from './store-transfers.service';

@Controller('stores/transfers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StoreTransfersController {
  constructor(private readonly transfersService: StoreTransfersService) {}

  @Post()
  @RequirePermissions(PermissionCode.STORE_TRANSFER_REQUEST)
  requestTransfer(
    @Body() dto: CreateTransferDto,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.requestTransfer(dto, user.id);
  }

  @Get()
  @RequirePermissions(PermissionCode.STORE_READ)
  findAll(
    @Query('fromStoreId') fromStoreId?: string,
    @Query('toStoreId') toStoreId?: string,
    @Query('status') status?: string,
  ) {
    return this.transfersService.findAll({
      fromStoreId: fromStoreId ? parseInt(fromStoreId) : undefined,
      toStoreId: toStoreId ? parseInt(toStoreId) : undefined,
      status,
    });
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.STORE_READ)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.findOne(id);
  }

  @Patch(':id/approve')
  @RequirePermissions(PermissionCode.STORE_TRANSFER_APPROVE)
  approveTransfer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.approveTransfer(id, user.id, user.role);
  }

  @Patch(':id/reject')
  @RequirePermissions(PermissionCode.STORE_TRANSFER_APPROVE)
  rejectTransfer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.rejectTransfer(id, user.id, user.role);
  }

  @Patch(':id/complete')
  @RequirePermissions(PermissionCode.STORE_TRANSFER_COMPLETE)
  completeTransfer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.transfersService.completeTransfer(id, user.id, user.role);
  }
}
