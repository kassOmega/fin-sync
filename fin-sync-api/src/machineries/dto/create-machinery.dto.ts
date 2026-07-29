import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMachineryDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  ownershipType?: string;
}
