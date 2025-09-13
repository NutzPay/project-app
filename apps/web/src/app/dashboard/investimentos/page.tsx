"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/BaseLayout";
import WithdrawalModal from "@/components/modals/WithdrawalModal";

interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  totalWithdrawn: number;
  profitLoss: number;
  profitLossPercentage: number;
  yield30Days: number;
  yield7Days: number;
  totalApplications: number;
  activeApplications: number;
}

interface Investment {
  id: string;
  planId: string;
  planName: string;
  planType: string;
  principalAmount: number;
  currentValue: number;
  accumulatedYield: number;
  status: string;
  appliedAt: string;
  approvedAt?: string;
  maturityDate?: string;
  liquidatedAt?: string;
  annualYieldRate: number;
  dailyYieldRate: number;
  lockPeriodDays?: number;
  hasEarlyWithdraw: boolean;
  recentYields: Array<{
    id: string;
    yieldAmount: number;
    referenceDate: string;
    calculatedAt: string;
    isPaid: boolean;
    paidAt?: string;
  }>;
}

interface PortfolioAllocation {
  planName: string;
  planType: string;
  currentValue: number;
  percentage: number;
}

interface DailyPerformance {
  date: string;
  yield: number;
}

export default function InvestmentsPage() {
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioAllocation, setPortfolioAllocation] = useState<
    PortfolioAllocation[]
  >([]);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "investments" | "performance" | "documents"
  >("overview");
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);

  useEffect(() => {
    loadInvestmentData();
  }, []);

  const loadInvestmentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/investments/dashboard");

      if (!response.ok) {
        throw new Error("Erro ao carregar dados dos investimentos");
      }

      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
        setInvestments(data.investments);
        setPortfolioAllocation(data.portfolioAllocation);
        setDailyPerformance(data.dailyPerformance);
      }
    } catch (error) {
      console.error("Error loading investment data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados dos investimentos",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "matured":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "liquidated":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Ativo";
      case "pending":
        return "Pendente";
      case "matured":
        return "Vencido";
      case "cancelled":
        return "Cancelado";
      case "liquidated":
        return "Liquidado";
      default:
        return status;
    }
  };

  const getPlanTypeIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    const baseClass = "w-8 h-8 rounded-lg flex items-center justify-center";

    switch (type) {
      case "FIXED_INCOME":
        return (
          <div className={`${baseClass} bg-blue-100`}>
            <svg
              className={`${iconClass} text-blue-600`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        );
      case "LIQUIDITY":
        return (
          <div className={`${baseClass} bg-green-100`}>
            <svg
              className={`${iconClass} text-green-600`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        );
      case "PREMIUM":
        return (
          <div className={`${baseClass} bg-purple-100`}>
            <svg
              className={`${iconClass} text-purple-600`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${baseClass} bg-gray-100`}>
            <svg
              className={`${iconClass} text-gray-600`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        userType="operator"
        onWithdrawClick={() => setShowWithdrawalModal(true)}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        userType="operator"
        onWithdrawClick={() => setShowWithdrawalModal(true)}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadInvestmentData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!summary) {
    return (
      <DashboardLayout
        userType="operator"
        onWithdrawClick={() => setShowWithdrawalModal(true)}
      >
        <div className="text-center py-12">
          <p className="text-gray-600">Dados de investimento não encontrados</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userType="operator"
      onWithdrawClick={() => setShowWithdrawalModal(true)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">
              Meus Investimentos
            </h1>
            <p className="text-gray-600 mt-1">
              Acompanhe o desempenho de seus investimentos
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Ultima atualizacao</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date().toLocaleString("pt-BR")}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500">
                Valor Total Investido
              </h2>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">
              {formatCurrency(summary.totalInvested)}
            </div>
            <p className="text-xs text-gray-500">Capital aplicado</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500">Valor Atual</h2>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">
              {formatCurrency(summary.currentValue)}
            </div>
            <p className="text-xs text-gray-500">Valor com rendimentos</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500">
                Lucro/Prejuizo
              </h2>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  summary.profitLoss >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <svg
                  className={`w-4 h-4 ${summary.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      summary.profitLoss >= 0
                        ? "M7 11l5-5m0 0l5 5m-5-5v12"
                        : "M17 13l-5 5m0 0l-5-5m5 5V6"
                    }
                  />
                </svg>
              </div>
            </div>
            <div
              className={`text-2xl font-bold mb-1 ${
                summary.profitLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(Math.abs(summary.profitLoss))}
            </div>
            <p
              className={`text-xs ${summary.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatPercentage(summary.profitLossPercentage)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500">
                Rendimento (30 dias)
              </h2>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">
              {formatCurrency(summary.yield30Days)}
            </div>
            <p className="text-xs text-gray-500">Rendimento mensal</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">
                {summary.activeApplications}
              </div>
              <div className="text-sm text-gray-500">Investimentos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">
                {summary.totalApplications}
              </div>
              <div className="text-sm text-gray-500">Total de Aplicacoes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.yield7Days)}
              </div>
              <div className="text-sm text-gray-500">Rendimento (7 dias)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">
                {formatCurrency(summary.totalWithdrawn)}
              </div>
              <div className="text-sm text-gray-500">Total Retirado</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: "overview", label: "Visao Geral" },
              { key: "investments", label: "Meus Investimentos" },
              { key: "performance", label: "Desempenho" },
              { key: "documents", label: "Documentos" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Allocation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Alocacao do Portfolio
              </h3>
              <div className="space-y-4">
                {portfolioAllocation.map((allocation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      {getPlanTypeIcon(allocation.planType)}
                      <div>
                        <p className="font-medium text-black">
                          {allocation.planName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {allocation.planType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">
                        {formatCurrency(allocation.currentValue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(allocation.percentage || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Performance */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Desempenho Recente
              </h3>
              <div className="space-y-3">
                {dailyPerformance.slice(-7).map((performance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-black">
                        {new Date(performance.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        +{formatCurrency(performance.yield)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === "investments" && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black">
                Meus Investimentos Detalhados
              </h2>
              <p className="text-gray-600 mt-1">
                Informacoes completas sobre suas aplicacoes
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {investments.map((investment) => (
                  <div
                    key={investment.id}
                    className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvestment(investment)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getPlanTypeIcon(investment.planType)}
                        <div>
                          <h4 className="font-semibold text-black">
                            {investment.planName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Aplicado em{" "}
                            {new Date(investment.appliedAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}
                        >
                          {getStatusLabel(investment.status)}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Valor Investido</p>
                        <p className="font-semibold text-black">
                          {formatCurrency(investment.principalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Valor Atual</p>
                        <p className="font-semibold text-black">
                          {formatCurrency(investment.currentValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          Rendimento Acumulado
                        </p>
                        <p className="font-semibold text-green-600">
                          +{formatCurrency(investment.accumulatedYield)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Taxa Anual</p>
                        <p className="font-semibold text-black">
                          {(investment.annualYieldRate * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {investment.recentYields.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">
                          Ultimos Rendimentos
                        </p>
                        <div className="flex space-x-2">
                          {investment.recentYields
                            .slice(0, 3)
                            .map((yieldEntry, index) => (
                              <div
                                key={index}
                                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                              >
                                +{formatCurrency(yieldEntry.yieldAmount)}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Graficos de Desempenho
              </h3>
              <p className="text-gray-600">
                Graficos detalhados serao implementados aqui
              </p>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Documentos e Certificados
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-black">
                        Certificado de Investimento
                      </p>
                      <p className="text-sm text-gray-500">
                        Documento comprovatorio de aplicacao
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Baixar PDF
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-black">
                        Extrato Detalhado
                      </p>
                      <p className="text-sm text-gray-500">
                        Historico completo de rendimentos
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Baixar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
      />
    </DashboardLayout>
  );
}
