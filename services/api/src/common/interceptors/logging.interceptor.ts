import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    
    const { method, url, headers, ip } = req;
    const requestId = headers['x-request-id'];
    const userAgent = headers['user-agent'];

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        const { statusCode } = res;
        
        // Log format: [METHOD] /path - STATUS - RESPONSE_TIME ms - IP - REQUEST_ID
        this.logger.log(
          `[${method}] ${url} - ${statusCode} - ${responseTime}ms - ${ip} - ${requestId}`,
        );
        
        // For audit purposes, you could also save to database here
        // this.auditService.logRequest({ method, url, statusCode, responseTime, ip, requestId, userAgent });
      }),
    );
  }
}