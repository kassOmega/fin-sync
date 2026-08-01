import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  normalSide?: string;

  @IsOptional()
  parentId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
