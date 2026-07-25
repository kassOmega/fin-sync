import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyIncomeDto } from './create-company-income.dto';

export class UpdateCompanyIncomeDto extends PartialType(CreateCompanyIncomeDto) {}
