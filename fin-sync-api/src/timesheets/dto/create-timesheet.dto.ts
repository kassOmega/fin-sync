import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTimesheetDto {
  @IsNumber()
  employeeId: number;

  @IsDateString()
  date: string;

  @IsNumber()
  @IsOptional()
  regularHours?: number;

  @IsNumber()
  @IsOptional()
  overtimeHours?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsNumber()
  machineryId?: number;
}

export class ApproveTimesheetDto {
  @IsNumber()
  approvedById: number;
}
