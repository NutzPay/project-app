'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface FloatingNavProps {
  userType?: string; // Not used anymore, keeping for compatibility
  onWithdrawClick?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  isAction?: boolean;
  icon: React.ReactElement;
}

// Configuração única padronizada (mesmo que estava em transactions + Home)
const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 22V12h6v10" />
      </svg>
    )
  },
  {
    id: 'extrato',
    label: 'Extrato',
    href: '/dashboard/transactions',
    icon: (
      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: 'saque',
    label: 'Saque',
    href: '/dashboard/withdraw',
    isAction: true,
    icon: (
      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: 'pix',
    label: 'Pix',
    href: '/dashboard/pix',
    icon: (
      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  {
    id: 'usdt',
    label: 'USDT',
    href: '/dashboard/usdt',
    icon: (
      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'logout',
    label: 'Sair',
    href: '/auth/login',
    isAction: true,
    icon: (
      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    )
  }
];

export default function FloatingNav({ userType, onWithdrawClick }: FloatingNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => window.removeEventListener('scroll', controlNavbar);
    }
  }, [lastScrollY]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
    }`}>
      <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl px-1.5 py-1.5 md:px-2 md:py-2">
        <div className="flex items-center space-x-0.5 md:space-x-1">
          {navItems.map((item) => {
            const isActiveItem = isActive(item.href);
            const commonClasses = `group relative flex flex-col items-center justify-center px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all duration-300 min-w-[48px] md:min-w-[60px] ${
              isActiveItem
                ? 'bg-red-600 text-white shadow-lg scale-105'
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50/80'
            }`;

            const handleClick = async () => {
              console.log('FloatingNav: Clicked item', item.id);
              if (item.id === 'logout') {
                console.log('FloatingNav: Logging out');
                
                try {
                  await fetch('/api/auth/logout', {
                    method: 'POST',
                  });
                } catch (error) {
                  console.error('Error during logout:', error);
                }
                
                localStorage.clear();
                sessionStorage.clear();
                router.push('/auth/login');
              } else if (item.id === 'saque' && onWithdrawClick) {
                console.log('FloatingNav: Calling onWithdrawClick');
                onWithdrawClick();
              } else {
                console.log('FloatingNav: onWithdrawClick not available or wrong id');
              }
            };

            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={handleClick}
                  className={commonClasses}
                >
                  <div className={`transition-transform duration-300 ${
                    isActiveItem ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] md:text-xs font-medium mt-0.5 md:mt-1 transition-all duration-300 ${
                    isActiveItem ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator */}
                  {isActiveItem && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={commonClasses}
              >
                <div className={`transition-transform duration-300 ${
                  isActiveItem ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] md:text-xs font-medium mt-0.5 md:mt-1 transition-all duration-300 ${
                  isActiveItem ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                }`}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActiveItem && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Floating shadow */}
      <div className="absolute inset-0 bg-black/5 rounded-2xl -z-10 blur-xl"></div>
    </div>
  );
}