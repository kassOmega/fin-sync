import { MachineryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMachineryDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsEnum(MachineryStatus)
  @IsOptional()
  status?: MachineryStatus;
}
