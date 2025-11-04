// Configurações do Backoffice
// Isolado das configurações do dashboard

export interface BackofficeConfig {
  enabled: boolean;
  whitelist: string[];
  sessionDomain: string;
  cookiePrefix: string;
  jwtSecret: string;
}

// Feature Flag: Backoffice habilitado/desabilitado
export const BACKOFFICE_ENABLED = process.env.BACKOFFICE_ENABLED === 'true';

// Lista branca de emails autorizados
export const BACKOFFICE_WHITELIST: string[] = [
  // Adicionar emails autorizados aqui
  'admin@nutzbeta.com',
  'felix@nutzbeta.com',
  'developer@nutzbeta.com',
  'admin@nutzpay.com', // Admin principal de produção
];

// Configurações de sessão isoladas
export const BACKOFFICE_SESSION_CONFIG = {
  cookieName: 'backoffice-auth-token', // Diferente do dashboard
  domain: process.env.NODE_ENV === 'production' ? '.nutzbeta.com' : 'localhost',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict' as const,
  maxAge: 8 * 60 * 60, // 8 horas
  path: '/backoffice'
};

// JWT Secret separado para backoffice
export const BACKOFFICE_JWT_SECRET = process.env.BACKOFFICE_JWT_SECRET || 'backoffice-ultra-secure-secret-different-from-dashboard';

// Verificar se email está na whitelist
export function isEmailWhitelisted(email: string): boolean {
  return BACKOFFICE_WHITELIST.includes(email.toLowerCase());
}

// Verificar se backoffice está habilitado
export function isBackofficeEnabled(): boolean {
  return BACKOFFICE_ENABLED;
}

// Log de configuração (para debug)
console.log('🏗️ Backoffice Config:', {
  enabled: BACKOFFICE_ENABLED,
  whitelistCount: BACKOFFICE_WHITELIST.length,
  environment: process.env.NODE_ENV,
  sessionCookie: BACKOFFICE_SESSION_CONFIG.cookieName
});