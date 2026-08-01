import { StoreTxType } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';

export class StoreTransactionDto {
  @IsEnum(StoreTxType)
  type: StoreTxType;

  @IsNumber()
  quantity: number;

  @IsInt()
  @IsOptional()
  issuedToUserId?: number;

  @IsInt()
  @IsOptional()
  issuedById?: number;

  @IsInt()
  @IsOptional()
  projectId?: number;
}
