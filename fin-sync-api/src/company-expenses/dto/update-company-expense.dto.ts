import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyExpenseDto } from './create-company-expense.dto';

export class UpdateCompanyExpenseDto extends PartialType(CreateCompanyExpenseDto) {}
