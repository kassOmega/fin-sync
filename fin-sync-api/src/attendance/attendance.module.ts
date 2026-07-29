import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { ProjectAttendanceController } from './project-attendance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController, ProjectAttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
