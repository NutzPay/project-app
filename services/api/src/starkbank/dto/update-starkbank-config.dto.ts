import { IsEnum, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { StarkbankEnvironment } from '@prisma/client';

export class UpdateStarkbankConfigDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @IsEnum(StarkbankEnvironment)
  environment: StarkbankEnvironment;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class StarkbankConfigResponseDto {
  id: string;
  projectId: string;
  publicKey: string; // Never return private key
  environment: StarkbankEnvironment;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}