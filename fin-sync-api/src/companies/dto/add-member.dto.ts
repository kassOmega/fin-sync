import { SystemRole } from '@prisma/client';
import { IsEnum, IsInt } from 'class-validator';

export class AddMemberDto {
  @IsInt()
  userId: number;

  @IsEnum(SystemRole)
  role: SystemRole;
}
