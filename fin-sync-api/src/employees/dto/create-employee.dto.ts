import { SystemRole } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum EmploymentTypeEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  DAILY_LABORER = 'DAILY_LABORER',
}

export class CreateEmployeeDto {
  @IsString()
  employeeCode: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  designation: string;

  @IsEnum(EmploymentTypeEnum)
  @IsOptional()
  employmentType?: EmploymentTypeEnum;

  @IsNumber()
  @IsOptional()
  baseSalary?: number;

  /** Net (take-home) MONTHLY — when provided WITHOUT baseSalary, the system
   *  back-calculates the gross using the company's active tax/pension rules. */
  @IsNumber()
  @IsOptional()
  netSalary?: number;

  /** Pay frequency: MONTHLY (default) | WEEKLY | DAILY */
  @IsString()
  @IsOptional()
  payFrequency?: string;

  /** Linked WorkPosition — position-based allowances auto-apply from this. */
  @IsNumber()
  @IsOptional()
  positionId?: number;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsNumber()
  @IsOptional()
  dailyRate?: number;

  /** Weekly pay rate — derived as daily × 6 when monthly/daily is provided. */
  @IsNumber()
  @IsOptional()
  weeklyRate?: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Role trigger — when provided, auto-creates staff User + CompanyMember
  @IsEnum(SystemRole)
  @IsOptional()
  role?: SystemRole;

  // Optional password when auto-creating staff
  @IsString()
  @IsOptional()
  password?: string;

  @IsDateString()
  @IsOptional()
  joinedDate?: string;
}
