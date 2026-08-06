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
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@Controller('companies/:companyId/stores')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @RequirePermissions(PermissionCode.STORE_MANAGE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateStoreDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.create(companyId, dto, user.id);
  }

  @Get()
  @RequirePermissions(PermissionCode.STORE_READ)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('projectId') projectId?: string,
  ) {
    return this.storesService.findAll(
      companyId,
      projectId ? parseInt(projectId) : undefined,
    );
  }

  @Get(':storeId')
  @RequirePermissions(PermissionCode.STORE_READ)
  findOne(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    return this.storesService.findOne(companyId, storeId);
  }

  @Patch(':storeId')
  @RequirePermissions(PermissionCode.STORE_MANAGE)
  update(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(companyId, storeId, dto);
  }

  @Delete(':storeId')
  @RequirePermissions(PermissionCode.STORE_MANAGE)
  remove(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    return this.storesService.remove(companyId, storeId);
  }
}
