'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';

export default function EscrowPage() {
  const [showModal, setShowModal] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'history' | 'create'>('overview');

  // Dados zerados
  const balance = {
    totalHeld: 0,
    totalReleased: 0,
    totalReceived: 0,
    availableBalance: 0,
    yieldEarned: 0,
    pendingYield: 0
  };

  const statistics = {
    completedTransactions: 0,
    activeTransactions: 0,
    disputedTransactions: 0,
    totalVolume30Days: 0,
    averageTransactionValue: 0,
    successRate: 0,
    averageCompletionTime: 0
  };

  const transactions: any[] = [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <DashboardLayout userType="operator">
      {/* Modal de Desenvolvimento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.082 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-black mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600 text-center mb-6">
              A funcionalidade de <strong>Conta Escrow</strong> está sendo implementada e estará disponível em breve.
              Estamos trabalhando para trazer a melhor experiência de custódia de valores para você.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-black hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Conta Escrow</h1>
            <p className="text-gray-600 mt-1">Gerencie transações seguras com custódia de valores</p>
          </div>
        </div>

        {/* Escrow Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Saldo em Custódia</h2>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {formatCurrency(balance.totalHeld)}
            </div>
            <p className="text-sm text-gray-500">Valores retidos em {statistics.activeTransactions} transações ativas</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Rendimentos Acumulados</h2>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(balance.yieldEarned)}
            </div>
            <p className="text-sm text-gray-500">+ {formatCurrency(balance.pendingYield)} pendentes</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Taxa de Sucesso</h2>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {statistics.successRate}%
            </div>
            <p className="text-sm text-gray-500">Média de {statistics.averageCompletionTime} dias por transação</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Visão Geral' },
              { key: 'active', label: 'Transações Ativas' },
              { key: 'history', label: 'Histórico' },
              { key: 'create', label: 'Nova Transação' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content - Mensagem de vazio */}
        <div className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600 mb-4">
              A funcionalidade de Conta Escrow está sendo implementada.<br />
              Em breve você poderá realizar transações com custódia de valores.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
