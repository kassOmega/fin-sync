import { SystemRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(SystemRole)
  role: SystemRole;

  @IsInt()
  companyId: number;

  @IsString()
  @IsOptional()
  employmentType?: string;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsNumber()
  @IsOptional()
  dailyRate?: number;

  @IsNumber()
  @IsOptional()
  weeklyRate?: number;

  @IsNumber()
  @IsOptional()
  baseSalary?: number;
}
