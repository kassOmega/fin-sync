import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  progress?: number;

  @IsInt()
  companyId: number;
}
