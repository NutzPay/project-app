import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ 
    example: '123456',
    description: '2FA TOTP code (required if 2FA is enabled)'
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpCode?: string;
}

export class Setup2FADto {
  @ApiProperty({ example: 'My Device Name' })
  @IsString()
  @IsNotEmpty()
  deviceName: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  totpCode: string;
}