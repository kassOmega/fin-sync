import { SystemRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateMemberDto {
  @IsEnum(SystemRole)
  role: SystemRole;
}
