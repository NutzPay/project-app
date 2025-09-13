'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Offer {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  imagePath: string;
  targetUrl: string;
  audience: 'SELLER' | 'BUYER' | 'ALL';
  sortOrder: number;
}

export default function OffersSection() {
  const [banners, setBanners] = useState<Offer[]>([]);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load banners from localStorage or use defaults
    const loadBanners = () => {
      const savedOffers = localStorage.getItem('nutzpay-banners');
      if (savedOffers) {
        const parsedOffers = JSON.parse(savedOffers);
        // Filter only active banners and sort by sortOrder
        const activeBanners = parsedOffers
          .filter((banner: Offer) => banner.isActive)
          .sort((a: Offer, b: Offer) => a.sortOrder - b.sortOrder);
        setBanners(activeBanners);
        return;
      }
      
      // Default banners if nothing in localStorage
      const defaultBanners: Offer[] = [
        {
          id: '1',
          title: 'Nova API de Pagamentos',
          subtitle: 'Conheça a integração mais rápida para sellers',
          ctaText: 'Acessar',
          imagePath: 'luxa.png',
          targetUrl: 'https://nutzpay.com/api',
          audience: 'SELLER',
          sortOrder: 1,
        },
        {
          id: '2',
          title: 'Taxas Especiais no Pix',
          subtitle: 'Condições diferenciadas para aumentar suas vendas',
          ctaText: 'Ver mais',
          imagePath: 'newyork.png',
          targetUrl: 'https://nutzpay.com/pix-especial',
          audience: 'SELLER',
          sortOrder: 2,
        },
        {
          id: '3',
          title: 'Gaming Experience',
          subtitle: 'Plataforma otimizada para gamers e influenciadores',
          ctaText: 'Explorar',
          imagePath: 'gamer.png',
          targetUrl: 'https://nutzpay.com/gamer',
          audience: 'ALL',
          sortOrder: 3,
        },
      ];
      setBanners(defaultBanners);
    };
    
    loadBanners();
    
    // Listen for localStorage changes (when admin updates banners)
    const handleStorageChange = () => {
      loadBanners();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the admin panel
    window.addEventListener('bannersUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bannersUpdated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleItems((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const items = sectionRef.current?.querySelectorAll('[data-index]');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [banners]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="space-y-4">
      {/* Header - mais limpo */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Destaques</h2>
      </div>

      {/* Banners empilhados verticalmente - Mobile: 1 por vez, Desktop: todos */}
      <div className="space-y-4">
        {/* Mobile: apenas primeiro banner */}
        <div className="block md:hidden">
          {banners.slice(0, 1).map((banner, index) => (
            <BannerItem key={banner.id} banner={banner} index={index} visibleItems={visibleItems} />
          ))}
        </div>
        
        {/* Desktop: todos os banners */}
        <div className="hidden md:block space-y-4">
          {banners.map((banner, index) => (
            <BannerItem key={banner.id} banner={banner} index={index} visibleItems={visibleItems} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Componente banner separado para evitar duplicação
function BannerItem({ banner, index, visibleItems }: { banner: Offer; index: number; visibleItems: Set<number> }) {
  return (
    <div
      data-index={index}
      className={`group relative h-32 md:h-36 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl cursor-pointer transition-all duration-500 transform ${
        visibleItems.has(index)
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
      style={{
        transitionDelay: `${index * 200}ms`,
      }}
      onClick={() => window.open(banner.targetUrl, '_blank')}
    >
      {/* Background Image with Gradient Overlays */}
      <div className="absolute inset-0">
        {/* Gradient background as fallback */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800"></div>
        
        {/* Optional background image */}
        {banner.imagePath && (
          <Image
            src={`/banners/${banner.imagePath}`}
            alt={banner.title}
            fill
            className="object-cover"
            onLoad={() => console.log('Image loaded:', banner.imagePath)}
            onError={(e) => {
              console.error('Image failed to load:', banner.imagePath);
            }}
            unoptimized
          />
        )}
        
        {/* Gradient overlay para garantir legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
      </div>

      {/* Content - Título e subtítulo sobre a imagem */}
      <div className="relative h-full flex flex-col justify-center px-6 md:px-8">
        <div className="max-w-2xl">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            {banner.title}
          </h3>
          
          {banner.subtitle && (
            <p className="text-white/90 text-sm md:text-base leading-relaxed mb-4 max-w-md">
              {banner.subtitle}
            </p>
          )}

          {/* CTA Button/Link - opcional e mais sutil */}
          {banner.ctaText && (
            <div className="inline-flex items-center space-x-2 text-white font-semibold text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 group-hover:scale-105">
              <span>{banner.ctaText}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}