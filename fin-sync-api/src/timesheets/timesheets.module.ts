import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  ProjectTimesheetsController,
  TimesheetsController,
} from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';

@Module({
  imports: [PrismaModule],
  controllers: [TimesheetsController, ProjectTimesheetsController],
  providers: [TimesheetsService],
})
export class TimesheetsModule {}
