import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTransferDto {
  @IsInt()
  fromStoreId: number;

  @IsInt()
  toStoreId: number;

  @IsInt()
  itemId: number;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}
