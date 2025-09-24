'use client';

import { useEffect, useState } from 'react';
import { formatBRL, formatCrypto } from '@/lib/currency';

interface PaymentSuccessProps {
  usdtAmount: string;
  brlAmount: string;
  onComplete?: () => void;
}

export default function PaymentSuccess({ usdtAmount, brlAmount, onComplete }: PaymentSuccessProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    // Animation sequence
    const timeouts = [
      setTimeout(() => setAnimationStep(1), 200),  // Show checkmark
      setTimeout(() => setAnimationStep(2), 800),  // Show text
      setTimeout(() => setAnimationStep(3), 1200), // Show amounts
      setTimeout(() => setShowConfetti(false), 3000), // Hide confetti
      setTimeout(() => onComplete?.(), 4000) // Complete animation
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="text-center space-y-6 py-8">
      {/* Confetti Background */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r ${
                i % 4 === 0 ? 'from-green-400 to-green-600' :
                i % 4 === 1 ? 'from-blue-400 to-blue-600' :
                i % 4 === 2 ? 'from-yellow-400 to-yellow-600' :
                'from-purple-400 to-purple-600'
              } rounded animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Success Checkmark */}
      <div className={`relative transition-all duration-500 transform ${
        animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}>
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <div className={`transition-all duration-500 transform ${
        animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <h2 className="text-3xl font-bold text-green-600 mb-2">
          🎉 Pagamento Confirmado!
        </h2>
        <p className="text-gray-600 text-lg">
          Sua compra foi processada com sucesso
        </p>
      </div>

      {/* Amount Details */}
      <div className={`transition-all duration-500 transform ${
        animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-medium">💰 Valor pago:</span>
            <span className="text-2xl font-bold text-green-800">{brlAmount}</span>
          </div>
          
          <div className="w-full h-px bg-green-200"></div>
          
          <div className="flex items-center justify-between">
            <span className="text-green-700 font-medium">🪙 USDT creditado:</span>
            <span className="text-2xl font-bold text-green-800">{usdtAmount}</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className={`transition-all duration-500 transform ${
        animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">✅ Tudo certo!</p>
              <p>O USDT já está disponível em sua carteira. Você pode verificar seu saldo na tela principal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}