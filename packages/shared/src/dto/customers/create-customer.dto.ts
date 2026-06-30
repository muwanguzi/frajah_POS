import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CustomerType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  VIP = 'vip',
}

export class CreateCustomerDto {
  @IsString()
  @MaxLength(255)
  name: string;

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
  creditLimit?: number;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
  creditLimit?: number;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
