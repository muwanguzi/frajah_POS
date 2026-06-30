import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tinNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paymentTermsDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  creditLimit?: number;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tinNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paymentTermsDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  creditLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
