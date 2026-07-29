import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MeasuringUnitsService } from './measuring-units.service';

@Controller('measuring-units')
@UseGuards(JwtAuthGuard)
export class MeasuringUnitsController {
  constructor(private readonly service: MeasuringUnitsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.service.create(body.name);
  }
}
