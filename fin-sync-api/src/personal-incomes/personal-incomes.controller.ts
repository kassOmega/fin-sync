import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePersonalIncomeDto } from './dto/create-personal-income.dto';
import { PersonalIncomesService } from './personal-incomes.service';

@Controller('personal-incomes')
@UseGuards(JwtAuthGuard)
export class PersonalIncomesController {
  constructor(private readonly service: PersonalIncomesService) {}

  @Post()
  create(
    @Body() dto: CreatePersonalIncomeDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.create(dto, userId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.service.findAll(userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.service.remove(id, userId);
  }
}
