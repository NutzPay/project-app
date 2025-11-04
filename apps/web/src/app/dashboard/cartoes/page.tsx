'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/BaseLayout';
import { CreditCard, Plus, Receipt, Truck, CheckCircle2, TrendingDown } from 'lucide-react';

export default function CartoesPage() {
  const [showModal, setShowModal] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'solicitar' | 'extrato' | 'entrega'>('overview');

  // Dados zerados
  const conta = {
    saldoDisponivel: 0,
    totalGastoMes: 0
  };

  const cartoes: any[] = [];
  const transacoes: any[] = [];

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
              A funcionalidade de <strong>Cartões de Crédito</strong> está sendo implementada e estará disponível em breve.
              Estamos trabalhando para trazer a melhor experiência de gestão de cartões para você.
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Cartões</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie seus cartões físicos e virtuais, acompanhe gastos e rastreie entregas.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Visão Geral', icon: CreditCard },
            { key: 'solicitar', label: 'Solicitar Cartão', icon: Plus },
            { key: 'extrato', label: 'Extrato', icon: Receipt },
            { key: 'entrega', label: 'Acompanhar Entrega', icon: Truck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content - Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Account Balance Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-black">Saldo da Conta</h2>
                <p className="text-sm text-gray-500">Saldo disponível para gastos com cartões</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(conta.saldoDisponivel)}
            </div>
            <div className="text-sm text-gray-500">
              Gasto total este mês: <span className="font-medium text-red-600">{formatCurrency(conta.totalGastoMes)}</span>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Cartões</p>
                  <p className="text-xl font-bold text-black">{cartoes.length}</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cartões Ativos</p>
                  <p className="text-xl font-bold text-black">0</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gasto Mensal</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(conta.totalGastoMes)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Transações</p>
                  <p className="text-xl font-bold text-black">0</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Funcionalidade em Desenvolvimento
              </h3>
              <p className="text-gray-600 mb-6">
                A funcionalidade de Cartões de Crédito está sendo implementada.<br />
                Em breve você poderá solicitar e gerenciar seus cartões físicos e virtuais.
              </p>
              <button
                onClick={() => setActiveTab('solicitar')}
                disabled
                className="inline-flex items-center space-x-2 bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Solicitar Novo Cartão (Em breve)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content - Other tabs */}
      {activeTab !== 'overview' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Funcionalidade em Desenvolvimento
            </h3>
            <p className="text-gray-600 mb-4">
              Esta funcionalidade está sendo implementada e estará disponível em breve.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
