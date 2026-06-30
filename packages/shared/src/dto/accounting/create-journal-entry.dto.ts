import {
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalLineDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  debit: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  credit: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateJournalEntryDto {
  @IsString()
  @MaxLength(500)
  description: string;

  @IsDateString()
  entryDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
