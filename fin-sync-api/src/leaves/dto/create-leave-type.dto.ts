import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsNumber()
  defaultDaysPerYear?: number;

  @IsOptional()
  @IsNumber()
  maxCarryForwardDays?: number;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
