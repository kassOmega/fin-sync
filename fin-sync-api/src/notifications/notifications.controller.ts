import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Roles(
    SystemRole.Owner,
    SystemRole.Cashier,
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
    SystemRole.Sales,
  )
  findAll(@CurrentUser('id') userId: number) {
    return this.service.findAll(userId);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser('id') userId: number) {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @Roles(
    SystemRole.Owner,
    SystemRole.Cashier,
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
    SystemRole.Sales,
  )
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.service.markAsRead(id);
  }

  @Patch('read-all')
  @Roles(
    SystemRole.Owner,
    SystemRole.Cashier,
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
    SystemRole.Sales,
  )
  markAllAsRead(@CurrentUser('id') userId: number) {
    return this.service.markAllAsRead(userId);
  }
}
