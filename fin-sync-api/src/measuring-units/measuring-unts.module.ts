import { Module } from '@nestjs/common';
import { MeasuringUnitsController } from './measuring-units.controller';
import { MeasuringUnitsService } from './measuring-units.service';

@Module({
  controllers: [MeasuringUnitsController],
  providers: [MeasuringUnitsService],
})
export class MeasuringUnitsModule {}
