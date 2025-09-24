import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  IsUrl,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { OfferAudience } from '@prisma/client';

export class CreateOfferDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  ctaText?: string;

  @IsString()
  @IsUrl()
  targetUrl: string;

  @IsOptional()
  @IsEnum(OfferAudience)
  audience?: OfferAudience = OfferAudience.SELLER;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}