import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Session,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto, Setup2FADto, Verify2FADto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto, @Session() session) {
    const result = await this.authService.login(
      req.user,
      loginDto.totpCode,
      req,
    );
    
    // Store session info
    session.userId = req.user.id;
    session.accessToken = result.access_token;
    
    return result;
  }

  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiBearerAuth('apikey')
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Session() session) {
    if (session.accessToken) {
      await this.authService.logout(session.accessToken);
      session.destroy();
    }
    
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiBearerAuth('apikey')
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiOperation({ summary: 'Setup 2FA for current user' })
  @ApiResponse({ status: 200, description: '2FA setup initiated' })
  @ApiBearerAuth('apikey')
  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/setup')
  async setup2FA(@Request() req) {
    return this.authService.setup2FA(req.user.userId);
  }

  @ApiOperation({ summary: 'Enable 2FA with TOTP code' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiBearerAuth('apikey')
  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/enable')
  async enable2FA(@Request() req, @Body() dto: Verify2FADto) {
    return this.authService.enable2FA(req.user.userId, dto.totpCode);
  }

  @ApiOperation({ summary: 'Disable 2FA with TOTP code' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiBearerAuth('apikey')
  @UseGuards(AuthGuard('jwt'))
  @Post('2fa/disable')
  async disable2FA(@Request() req, @Body() dto: Verify2FADto) {
    return this.authService.disable2FA(req.user.userId, dto.totpCode);
  }
}