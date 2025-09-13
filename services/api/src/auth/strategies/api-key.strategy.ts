import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(request: any): Promise<any> {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    // Expected format: "NutzKey ntz_live_..." or "NutzKey ntz_test_..."
    const [scheme, apiKey] = authHeader.split(' ');
    
    if (scheme !== 'NutzKey' || !apiKey) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const result = await this.authService.validateApiKey(apiKey);
    
    // Check IP whitelist if configured
    if (result.apiKey.ipWhitelist.length > 0) {
      const clientIp = request.ip || request.connection.remoteAddress;
      if (!result.apiKey.ipWhitelist.includes(clientIp)) {
        throw new UnauthorizedException('IP not allowed');
      }
    }
    
    return result;
  }
}