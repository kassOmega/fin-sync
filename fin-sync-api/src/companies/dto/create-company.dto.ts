import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  currency?: string; // Default will be handled by Prisma

  // Temporary workers (DailyLaborers) settings
  @IsString()
  @IsOptional()
  tempWorkerTimeMode?: string; // ATTENDANCE | TIMESHEET

  @IsBoolean()
  @IsOptional()
  tempWorkerTaxEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  tempWorkerTaxRate?: number;
}
