import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonalExpenseDto } from './create-personal-expense.dto';

export class UpdatePersonalExpenseDto extends PartialType(CreatePersonalExpenseDto) {}
