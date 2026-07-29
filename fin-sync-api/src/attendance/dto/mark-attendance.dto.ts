import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum AttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
}

export class MarkAttendanceDto {
  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatusEnum)
  @IsOptional()
  status?: AttendanceStatusEnum;

  @IsOptional()
  checkIn?: string;

  @IsOptional()
  checkOut?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsOptional()
  projectId?: number;
}
