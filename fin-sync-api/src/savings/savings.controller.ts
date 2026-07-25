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
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { SavingsService } from './savings.service';

@Controller('savings')
@UseGuards(RolesGuard)
@Roles(SystemRole.Owner)
export class SavingsController {
  constructor(private readonly service: SavingsService) {}

  @Post()
  create(@Body() dto: CreateSavingDto, @CurrentUser('id') userId: number) {
    return this.service.create(dto, userId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.service.findAll(userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSavingDto,
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
