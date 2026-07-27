import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonalIncomeDto } from './create-personal-income.dto';

export class UpdatePersonalIncomeDto extends PartialType(CreatePersonalIncomeDto) {}
