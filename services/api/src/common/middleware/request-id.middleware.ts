import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export function RequestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  
  next();
}