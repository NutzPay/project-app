'use client';

import Image from 'next/image';

export default function BackofficeFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 text-gray-900 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <Image
                src="/logo.png"
                alt="Nutz"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <p className="text-gray-600 text-xs">© {currentYear} Nutz - Backoffice</p>
          </div>
          
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-gray-500">
              Sistema de gestão administrativo
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}