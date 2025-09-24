'use client';

import { useEffect, useState } from 'react';
import { useImpersonation } from '@/hooks/usePermissions';
import { AlertTriangle, LogOut, Shield } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, endImpersonation } = useImpersonation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(isImpersonating);
  }, [isImpersonating]);

  if (!isVisible || !impersonatedUser) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <span className="font-semibold text-sm sm:text-base">
                Modo Impersonação Ativo
              </span>
              <span className="text-red-100 text-sm">
                Você está acessando como <strong>{impersonatedUser.email}</strong> (via Backoffice)
              </span>
            </div>
          </div>
          
          <button
            onClick={endImpersonation}
            className="flex items-center space-x-2 bg-red-800 hover:bg-red-900 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
            title="Encerrar impersonação e retornar ao Backoffice"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Impersonação</span>
          </button>
        </div>
      </div>
      
      {/* Indicador visual na borda inferior */}
      <div className="h-1 bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400 animate-pulse"></div>
    </div>
  );
}

export function ImpersonationSpacer() {
  const { isImpersonating } = useImpersonation();
  
  if (!isImpersonating) {
    return null;
  }
  
  // Espaçador para compensar o banner fixo
  return <div className="h-16"></div>;
}