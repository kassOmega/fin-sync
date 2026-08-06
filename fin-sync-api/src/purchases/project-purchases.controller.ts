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
import { PurchasesService } from './purchases.service';

@Controller('companies/:companyId/projects/:projectId/purchases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectPurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Get()
  @RequirePermissions(PermissionCode.PURCHASES_READ)
  findAll(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.service.findByProject(projectId);
  }

  @Post()
  @RequirePermissions(PermissionCode.PURCHASES_WRITE)
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: any,
    @CurrentUser('id') userId: number,
  ) {
    body.projectId = projectId;
    return this.service.create(companyId, body, userId);
  }
}
