import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkPositionsController } from './work-positions.controller';
import { WorkPositionsService } from './work-positions.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkPositionsController],
  providers: [WorkPositionsService],
  exports: [WorkPositionsService],
})
export class WorkPositionsModule {}
