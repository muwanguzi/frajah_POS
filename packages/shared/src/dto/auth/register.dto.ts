import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { Role } from '../../enums/role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.CASHIER;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
