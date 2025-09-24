'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsVisible(false), 500);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Nutz"
            width={80}
            height={80}
            className="w-20 h-20 mx-auto object-contain animate-pulse"
            unoptimized
          />
        </div>
        
        {/* Minimal Progress */}
        <div className="w-32 mx-auto">
          <div className="w-full bg-gray-100 rounded-full h-0.5 overflow-hidden">
            <div 
              className="h-full bg-red-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Loading Dots */}
          <div className="mt-6 flex justify-center space-x-1">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}