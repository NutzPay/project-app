import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsEmail, 
  IsEnum, 
  IsOptional, 
  IsNumber,
  IsPositive,
  Length,
} from 'class-validator';
import { CompanyStatus } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Empresa Exemplo LTDA' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'contato@empresa.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '12345678000100' })
  @IsNotEmpty()
  @IsString()
  @Length(14, 14) // CNPJ format
  document: string;

  @ApiPropertyOptional({ enum: CompanyStatus, example: CompanyStatus.PENDING_VERIFICATION })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @ApiPropertyOptional({ example: 'plan_basic' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ example: 50000.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monthlyLimit?: number;

  @ApiPropertyOptional({ example: 5000.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  dailyLimit?: number;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  requestsPerMinute?: number;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class UpdateCompanyStatusDto {
  @ApiProperty({ enum: CompanyStatus, example: CompanyStatus.ACTIVE })
  @IsEnum(CompanyStatus)
  @IsNotEmpty()
  status: CompanyStatus;
}