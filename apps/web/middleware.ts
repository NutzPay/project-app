import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

// Backoffice configuration (inline to avoid import issues)
const BACKOFFICE_ENABLED = process.env.BACKOFFICE_ENABLED === 'true'
const BACKOFFICE_JWT_SECRET = process.env.BACKOFFICE_JWT_SECRET || 'backoffice-ultra-secure-secret-isolated-from-dashboard-v1'
const BACKOFFICE_SESSION_CONFIG = {
  cookieName: 'backoffice-auth-token',
  path: '/backoffice'
}
const BACKOFFICE_WHITELIST = [
  'admin@nutzbeta.com',
  'felix@nutzbeta.com', 
  'developer@nutzbeta.com'
]

function isEmailWhitelisted(email: string): boolean {
  return BACKOFFICE_WHITELIST.includes(email.toLowerCase())
}

interface UserToken {
  userId: string
  email: string
  role: string
}

interface BackofficeToken {
  userId: string
  email: string
  role: string
  sessionType: string
}

// Rate limiting storage (em produção usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const key = ip
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // ============================================
  // PROTEÇÃO BACKOFFICE
  // ============================================
  if (pathname.startsWith('/backoffice') && 
      !pathname.startsWith('/backoffice/login') && 
      !pathname.startsWith('/backoffice/test-') && 
      !pathname.startsWith('/backoffice/debug-')) {
    
    // Rate limiting mais rigoroso para backoffice (100 req/min)
    if (!checkRateLimit(`backoffice_${ip}`, 100, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded for admin area' },
        { status: 429 }
      )
    }

    // Verificar token de sessão do backoffice (exceto para APIs de auth)
    if (!pathname.startsWith('/api/backoffice/auth/')) {
      const backofficeToken = request.cookies.get('backoffice-auth-token')?.value ||
                              request.cookies.get('backoffice-auth-token-http')?.value
      
      // Debug: log do cookie para desenvolvimento
      console.log(`[MIDDLEWARE-DEBUG] Path: ${pathname}`);
      console.log(`[MIDDLEWARE-DEBUG] Cookie value: ${backofficeToken || 'NOT_FOUND'}`);
      console.log(`[MIDDLEWARE-DEBUG] All cookies:`, 
        Array.from(request.cookies).map(([name, cookie]) => `${name}=${cookie.value}`).join('; ')
      );

      if (!backofficeToken) {
        console.log(`[MIDDLEWARE-DEBUG] No backoffice token found, redirecting to login`);
        if (pathname.startsWith('/api/backoffice/')) {
          return NextResponse.json(
            { success: false, error: 'Backoffice authentication required' },
            { status: 401 }
          )
        } else {
          return NextResponse.redirect(new URL('/backoffice/login', request.url))
        }
      }

      // Para desenvolvimento, vamos aceitar tokens simples que contém admin-session
      if (!backofficeToken.includes('admin-session')) {
        console.log(`[MIDDLEWARE-DEBUG] Invalid backoffice token format: ${backofficeToken}`);
        if (pathname.startsWith('/api/backoffice/')) {
          return NextResponse.json(
            { success: false, error: 'Invalid backoffice session' },
            { status: 401 }
          )
        } else {
          return NextResponse.redirect(new URL('/backoffice/login', request.url))
        }
      }
      
      console.log(`[MIDDLEWARE-DEBUG] Valid backoffice token found, allowing access`);
    }

    return NextResponse.next()
  }

  // ============================================
  // PROTEÇÃO ÁREA DE USUÁRIOS/SELLERS
  // ============================================
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/user') || pathname.startsWith('/api/transactions')) {
    
    // Rate limiting normal para usuários (1000 req/min)
    if (!checkRateLimit(`user_${ip}`, 1000, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Verificação de token de usuário normal
    const userToken = request.cookies.get('auth-token')?.value

    if (!userToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      } else {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }

    try {
      const decoded = verify(userToken, process.env.JWT_SECRET || 'temp-secret-key-for-dev') as UserToken
      // Token de usuário válido
    } catch (error) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Invalid authentication token' },
          { status: 401 }
        )
      } else {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }

    return NextResponse.next()
  }

  // ============================================
  // PROTEÇÃO GERAL
  // ============================================
  
  // Rate limiting geral (2000 req/min)
  if (!checkRateLimit(`general_${ip}`, 2000, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Backoffice protected routes
    '/backoffice/((?!login).)*',
    '/api/backoffice/:path*',
    
    // User/Seller protected routes
    '/dashboard/:path*',
    '/api/user/:path*',
    '/api/transactions/:path*',
    '/api/dashboard/:path*',
    '/api/investments/:path*'
  ],
}