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
import { RequirePermissions } from '../common/decorators/permission.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('companies/:companyId/accounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Post()
  @RequirePermissions(PermissionCode.ACCOUNTS_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: CreateAccountDto,
  ) {
    return this.service.create(companyId, dto);
  }

  @Get()
  @RequirePermissions(PermissionCode.ACCOUNTS_READ)
  findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll(companyId, {
      ...(type && { type }),
      ...(search && { search }),
      ...(isActive !== undefined && { isActive }),
    });
  }

  @Get('tree')
  @RequirePermissions(PermissionCode.ACCOUNTS_READ)
  getTree(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.getTree(companyId);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ACCOUNTS_READ)
  findOne(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(companyId, id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.ACCOUNTS_WRITE)
  update(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.ACCOUNTS_WRITE)
  remove(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(companyId, id);
  }
}
