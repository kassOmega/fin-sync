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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
@UseGuards(RolesGuard)
@Roles(SystemRole.Owner)
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Post()
  create(@Body() dto: CreateBudgetDto, @CurrentUser('id') userId: number) {
    return this.service.create(
      {
        category: dto.category,
        amount: dto.amount,
        frequency: dto.frequency,
        ...(dto.startDate && { startDate: dto.startDate }),
      },
      userId,
    );
  }

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.service.findAll(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.update(
      id,
      {
        ...dto,
        ...(dto.startDate && { startDate: dto.startDate }),
      },
      userId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.remove(id, userId);
  }
}
