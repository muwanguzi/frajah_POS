import {
  IsUUID,
  IsNumber,
  Min,
  IsString,
  IsDateString,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsDateString()
  expenseDate: string;

  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  receipt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  receipt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor?: string;
}
