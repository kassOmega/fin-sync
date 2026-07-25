import { SystemRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
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
  role: SystemRole; // Cashier, Storekeeper, etc.

  @IsInt()
  companyId: number; // The company they are being assigned to
}
