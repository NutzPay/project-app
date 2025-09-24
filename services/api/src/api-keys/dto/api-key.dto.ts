import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsArray, 
  IsOptional, 
  IsDateString,
  ArrayNotEmpty,
  IsIP,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production API Key' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ 
    example: ['payments:read', 'payments:write', 'webhooks:*'],
    description: 'Array of scopes for this API key'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes: string[];

  @ApiPropertyOptional({ 
    example: ['192.168.1.100', '10.0.0.1'],
    description: 'Array of IP addresses allowed to use this key (empty = allow all)'
  })
  @IsOptional()
  @IsArray()
  @IsIP(undefined, { each: true })
  ipWhitelist?: string[];

  @ApiPropertyOptional({ 
    example: '2024-12-31T23:59:59.999Z',
    description: 'Expiration date for the API key (optional)'
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateApiKeyScopesDto {
  @ApiProperty({ 
    example: ['payments:read', 'webhooks:read'],
    description: 'New array of scopes for this API key'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes: string[];
}

export class UpdateApiKeyIpWhitelistDto {
  @ApiProperty({ 
    example: ['192.168.1.100', '10.0.0.1'],
    description: 'New array of allowed IP addresses (empty = allow all)'
  })
  @IsArray()
  @IsIP(undefined, { each: true })
  ipWhitelist: string[];
}