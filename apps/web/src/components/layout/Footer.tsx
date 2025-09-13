'use client';

import Image from 'next/image';
import Link from 'next/link';

interface FooterProps {
  variant?: 'dark' | 'light';
  showLinks?: boolean;
  compactMode?: boolean;
}

export default function Footer({ 
  variant = 'dark', 
  showLinks = false, 
  compactMode = false 
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  const footerClasses = variant === 'dark' 
    ? 'bg-black text-white' 
    : 'bg-gray-50 text-gray-900 border-t border-gray-200';
    
  const logoClasses = variant === 'dark' 
    ? 'filter brightness-0 invert' 
    : 'filter-none';
    
  const textClasses = variant === 'dark' 
    ? 'text-gray-400' 
    : 'text-gray-600';

  const linkClasses = variant === 'dark'
    ? 'text-gray-300 hover:text-white'
    : 'text-gray-600 hover:text-gray-900';

  if (compactMode) {
    return (
      <footer className={`${footerClasses} py-4`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Nutz"
                  width={32}
                  height={32}
                  className={`w-full h-full object-contain ${logoClasses}`}
                  unoptimized
                />
              </div>
              <p className={`${textClasses} text-xs`}>© {currentYear} Nutz</p>
            </div>
            
            {showLinks && (
              <div className="flex items-center space-x-4 text-xs">
                <Link href="/privacy" className={linkClasses}>
                  Privacidade
                </Link>
                <Link href="/terms" className={linkClasses}>
                  Termos
                </Link>
                <Link href="/support" className={linkClasses}>
                  Suporte
                </Link>
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={footerClasses}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="text-center">
          {/* Logo Section */}
          <div className="mb-4">
            <div className="w-24 h-24 mx-auto mb-2">
              <Image
                src="/logo.png"
                alt="Nutz"
                width={96}
                height={96}
                className={`w-full h-full object-contain ${logoClasses}`}
                unoptimized
              />
            </div>
            <p className={`${textClasses} text-xs`}>© {currentYear} Nutz</p>
          </div>

          {/* Links Section */}
          {showLinks && (
            <div className="flex justify-center space-x-6 mb-4">
              <Link href="/docs" className={`${linkClasses} text-sm transition-colors`}>
                Documentação
              </Link>
              <Link href="/support" className={`${linkClasses} text-sm transition-colors`}>
                Suporte
              </Link>
              <Link href="/privacy" className={`${linkClasses} text-sm transition-colors`}>
                Privacidade
              </Link>
              <Link href="/terms" className={`${linkClasses} text-sm transition-colors`}>
                Termos de Uso
              </Link>
            </div>
          )}

          {/* Additional Info */}
          <div className={`${textClasses} text-xs space-y-1`}>
            <p>Gateway de pagamentos seguro e confiável</p>
            {showLinks && (
              <p>
                Dúvidas? Entre em contato:{' '}
                <a 
                  href="mailto:suporte@nutzbeta.com" 
                  className={linkClasses}
                >
                  suporte@nutzbeta.com
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}