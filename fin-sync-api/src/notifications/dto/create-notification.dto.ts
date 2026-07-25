import { IsInt, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsString()
  title: string;

  @IsString()
  message: string;
}
