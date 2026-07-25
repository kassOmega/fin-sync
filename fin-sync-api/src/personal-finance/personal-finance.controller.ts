import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SystemRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PersonalFinanceService } from './personal-finance.service';

@Controller('personal-finance')
@UseGuards(RolesGuard)
@Roles(SystemRole.Owner)
export class PersonalFinanceController {
  constructor(private readonly service: PersonalFinanceService) {}

  @Get('budget-status')
  getBudgetStatus(@CurrentUser('id') userId: number) {
    return this.service.getBudgetStatus(userId);
  }

  @Post('rollover')
  executeRollover(
    @CurrentUser('id') userId: number,
    @Body() body: { action: 'ROLLOVER' | 'SAVINGS'; amount: number },
  ) {
    return this.service.executeRollover(userId, body.action, body.amount);
  }

  @Post('borrow')
  executeBorrow(
    @CurrentUser('id') userId: number,
    @Body() body: { amount: number },
  ) {
    return this.service.executeBorrow(userId, body.amount);
  }
}
