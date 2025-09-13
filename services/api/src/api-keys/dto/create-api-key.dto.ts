import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  scopes: string[];

  @IsOptional()
  @IsArray()
  ipWhitelist?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string; // usamos string ISO, ex: "2025-12-31T23:59:59Z"

  @IsString()
  companyId: string;
}

