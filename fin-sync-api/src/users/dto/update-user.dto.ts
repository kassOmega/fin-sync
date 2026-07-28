import { SystemRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(SystemRole)
  @IsOptional()
  role?: SystemRole;
}

export class UpdateStaffRoleDto {
  @IsEnum(SystemRole)
  role: SystemRole;
}
