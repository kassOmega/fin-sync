import { PartialType } from '@nestjs/mapped-types';
import { CreateMachineryDto } from './create-machinery.dto';

export class UpdateMachineryDto extends PartialType(CreateMachineryDto) {}
