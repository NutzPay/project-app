'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  imagePath: string;
  targetUrl: string;
  audience: 'SELLER' | 'BUYER' | 'ALL';
  isActive: boolean;
  sortOrder: number;
}

interface BannerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner?: Banner | null;
  onSave: (banner: Omit<Banner, 'id'>) => void;
}

const availableImages = [
  { name: 'luxa.png', label: 'Luxa - Design Moderno' },
  { name: 'newyork.png', label: 'New York - Urbano' },
  { name: 'gamer.png', label: 'Gamer - Tech' },
];

const audienceOptions = [
  { value: 'SELLER', label: 'Vendedores' },
  { value: 'BUYER', label: 'Compradores' },
  { value: 'ALL', label: 'Todos' },
];

export default function BannerConfigModal({ isOpen, onClose, banner, onSave }: BannerConfigModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    ctaText: '',
    imagePath: 'luxa.png',
    targetUrl: '',
    audience: 'SELLER' as const,
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        ctaText: banner.ctaText || '',
        imagePath: banner.imagePath,
        targetUrl: banner.targetUrl,
        audience: banner.audience,
        isActive: banner.isActive,
        sortOrder: banner.sortOrder,
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        ctaText: '',
        imagePath: 'luxa.png',
        targetUrl: '',
        audience: 'SELLER',
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [banner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {banner ? 'Editar Banner' : 'Novo Banner'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preview Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              
              {/* Banner Preview */}
              <div className="relative h-36 rounded-2xl overflow-hidden shadow-lg">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800"></div>
                  
                  {formData.imagePath && (
                    <Image
                      src={`/banners/${formData.imagePath}`}
                      alt={formData.title}
                      fill
                      className="object-cover"
                      onLoad={() => console.log('Modal image loaded:', formData.imagePath)}
                      onError={(e) => {
                        console.error('Modal image failed to load:', formData.imagePath);
                      }}
                      unoptimized
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
                </div>

                <div className="relative h-full flex flex-col justify-center px-6">
                  <div className="max-w-2xl">
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                      {formData.title || 'Título do Banner'}
                    </h3>
                    
                    {formData.subtitle && (
                      <p className="text-white/90 text-sm leading-relaxed mb-4 max-w-md">
                        {formData.subtitle}
                      </p>
                    )}

                    {formData.ctaText && (
                      <div className="inline-flex items-center space-x-2 text-white font-semibold text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <span>{formData.ctaText}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Imagem de Fundo
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {availableImages.map((image) => (
                    <label
                      key={image.name}
                      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.imagePath === image.name
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="imagePath"
                        value={image.name}
                        checked={formData.imagePath === image.name}
                        onChange={(e) => handleInputChange('imagePath', e.target.value)}
                        className="sr-only"
                      />
                      
                      <div className="flex items-center space-x-4 w-full">
                        <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image
                            src={`/banners/${image.name}`}
                            alt={image.label}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{image.label}</p>
                        </div>
                        {formData.imagePath === image.name && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Configuração</h3>
              
              {/* Título */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Nova API de Pagamentos"
                  maxLength={120}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/120 caracteres</p>
              </div>

              {/* Subtítulo */}
              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Subtítulo
                </label>
                <textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Conheça a integração mais rápida para sellers"
                  maxLength={180}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.subtitle.length}/180 caracteres</p>
              </div>

              {/* CTA Text */}
              <div>
                <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700 mb-2">
                  Texto do Botão
                </label>
                <input
                  type="text"
                  id="ctaText"
                  value={formData.ctaText}
                  onChange={(e) => handleInputChange('ctaText', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Acessar"
                  maxLength={40}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.ctaText.length}/40 caracteres</p>
              </div>

              {/* Target URL */}
              <div>
                <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Link de Destino *
                </label>
                <input
                  type="url"
                  id="targetUrl"
                  value={formData.targetUrl}
                  onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://nutzpay.com/api"
                  required
                />
              </div>

              {/* Audience */}
              <div>
                <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
                  Público Alvo
                </label>
                <select
                  id="audience"
                  value={formData.audience}
                  onChange={(e) => handleInputChange('audience', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {audienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  id="sortOrder"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Menor número aparece primeiro</p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Banner Ativo
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {banner ? 'Salvar Alterações' : 'Criar Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}