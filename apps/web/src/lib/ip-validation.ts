import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

/**
 * Gets the client IP address from the request
 */
export function getClientIP(request: NextRequest): string {
  // Check for X-Forwarded-For header (proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  // Check for X-Real-IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Check for Cloudflare headers
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address (may not work in all environments)
  const remoteAddr = request.headers.get('x-vercel-forwarded-for') || 
                     request.headers.get('x-forwarded-host') ||
                     'unknown';
  
  return remoteAddr;
}

/**
 * Checks if an IP address is authorized for payout operations
 */
export async function isIPAuthorized(ipAddress: string): Promise<boolean> {
  try {
    const authorizedIP = await prisma.authorizedIP.findFirst({
      where: {
        ipAddress,
        isActive: true
      }
    });

    return !!authorizedIP;
  } catch (error) {
    console.error('Error checking IP authorization:', error);
    // In case of database error, deny access for security
    return false;
  }
}

/**
 * Middleware function to validate IP for payout operations
 */
export async function validatePayoutIP(request: NextRequest): Promise<{
  isAuthorized: boolean;
  clientIP: string;
  error?: string;
}> {
  const clientIP = getClientIP(request);
  
  if (!clientIP || clientIP === 'unknown') {
    return {
      isAuthorized: false,
      clientIP: 'unknown',
      error: 'Unable to determine client IP address'
    };
  }

  const isAuthorized = await isIPAuthorized(clientIP);
  
  return {
    isAuthorized,
    clientIP,
    error: isAuthorized ? undefined : `IP ${clientIP} is not authorized for payout operations`
  };
}

/**
 * Get all active authorized IPs (for debugging/logging)
 */
export async function getActiveAuthorizedIPs(): Promise<string[]> {
  try {
    const ips = await prisma.authorizedIP.findMany({
      where: { isActive: true },
      select: { ipAddress: true }
    });

    return ips.map(ip => ip.ipAddress);
  } catch (error) {
    console.error('Error fetching active authorized IPs:', error);
    return [];
  }
}