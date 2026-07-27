import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PersonalAccountsService } from './personal-accounts.service';

@Controller('personal-accounts')
@UseGuards(RolesGuard)
@Roles(SystemRole.Owner)
export class PersonalAccountsController {
  constructor(private readonly service: PersonalAccountsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.service.findAll(userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: { name: string; balance: number },
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: { name?: string; balance?: number },
  ) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.remove(id, userId);
  }

  @Get('transfers')
  getTransfers(@CurrentUser('id') userId: number) {
    return this.service.getTransfers(userId);
  }

  @Post('transfer')
  transfer(
    @CurrentUser('id') userId: number,
    @Body()
    dto: {
      fromAccountId: number;
      toAccountId: number;
      amount: number;
      note?: string;
    },
  ) {
    return this.service.transfer(userId, dto);
  }
}
