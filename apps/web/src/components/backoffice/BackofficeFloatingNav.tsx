'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactElement;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/backoffice',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    href: '/backoffice/usuarios',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    )
  },
  {
    id: 'investimentos',
    label: 'Investimentos',
    href: '/backoffice/investimentos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    id: 'margens',
    label: 'Margens',
    href: '/backoffice/margens',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    id: 'adquirentes',
    label: 'Adquirentes',
    href: '/backoffice/adquirentes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
];

export default function BackofficeFloatingNav() {
  const pathname = usePathname();
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
    if (href === '/backoffice') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
    }`}>
      <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-lg sm:rounded-2xl shadow-2xl px-0.5 sm:px-2 py-1 sm:py-2">
        <div className="flex items-center space-x-0 sm:space-x-1">
          {navItems.map((item) => {
            const isActiveItem = isActive(item.href);
            const commonClasses = `group relative flex flex-col items-center justify-center px-1.5 sm:px-4 py-2 sm:py-3 rounded-md sm:rounded-xl transition-all duration-300 min-w-[40px] sm:min-w-[60px] ${
              isActiveItem
                ? 'bg-red-600 text-white shadow-lg scale-105'
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50/80'
            }`;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={commonClasses}
              >
                <div className={`transition-transform duration-300 ${
                  isActiveItem ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  <div className="w-4 h-4 sm:w-5 sm:h-5">
                    {item.icon}
                  </div>
                </div>
                <span className={`text-[10px] sm:text-xs font-medium mt-1 sm:mt-1 transition-all duration-300 leading-tight ${
                  isActiveItem ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                }`}>
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActiveItem && (
                  <div className="absolute -top-0.5 sm:-top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Floating shadow */}
      <div className="absolute inset-0 bg-black/5 rounded-xl sm:rounded-2xl -z-10 blur-xl"></div>
    </div>
  );
}