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

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePersonalExpenseDto } from './dto/create-personal-expense.dto';
import { UpdatePersonalExpenseDto } from './dto/update-personal-expense.dto';
import { PersonalExpensesService } from './personal-expenses.service';

@Controller('personal-expenses')
@UseGuards(JwtAuthGuard)
export class PersonalExpensesController {
  constructor(private readonly service: PersonalExpensesService) {}

  @Post()
  create(
    @Body() dto: CreatePersonalExpenseDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.create(dto, userId);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: number,
    @Query('category') category?: string,
    @Query('isCategorized') isCategorized?: string,
  ) {
    return this.service.findAll(
      userId,
      category,
      isCategorized ? isCategorized === 'true' : undefined,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonalExpenseDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.remove(id, userId);
  }
}
