'use client';

import { useState } from 'react';

interface FeeResult {
  originalAmount: number;
  feeAmount: number;
  finalAmount: number;
  feeBreakdown: {
    percentageFee: number;
    fixedFee: number;
  };
}

export default function TesteTaxasPage() {
  const [amount, setAmount] = useState<number>(1000);
  const [usdtAmount, setUsdtAmount] = useState<number>(100);
  const [exchangeRate, setExchangeRate] = useState<number>(5.85);

  // PIX Pay-in
  const [pixPayinPercent, setPixPayinPercent] = useState<number>(1.0);
  const [pixPayinFixed, setPixPayinFixed] = useState<number>(0.20);

  // PIX Pay-out
  const [pixPayoutPercent, setPixPayoutPercent] = useState<number>(1.5);
  const [pixPayoutFixed, setPixPayoutFixed] = useState<number>(0.50);

  // Manual Withdrawal
  const [manualWithdrawPercent, setManualWithdrawPercent] = useState<number>(2.0);
  const [manualWithdrawFixed, setManualWithdrawFixed] = useState<number>(1.00);

  // USDT Purchase
  const [usdtPurchasePercent, setUsdtPurchasePercent] = useState<number>(1.5);
  const [usdtPurchaseFixed, setUsdtPurchaseFixed] = useState<number>(0.30);

  const calculateFee = (
    baseAmount: number,
    percentFee: number,
    fixedFee: number,
    isAdditive: boolean = false
  ): FeeResult => {
    const percentageFee = baseAmount * (percentFee / 100);
    const totalFee = percentageFee + fixedFee;
    const finalAmount = isAdditive ? baseAmount + totalFee : baseAmount - totalFee;

    return {
      originalAmount: baseAmount,
      feeAmount: totalFee,
      finalAmount: Math.max(0, finalAmount),
      feeBreakdown: {
        percentageFee,
        fixedFee,
      },
    };
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  // Calculations
  const pixPayinResult = calculateFee(amount, pixPayinPercent, pixPayinFixed, false);
  const pixPayoutResult = calculateFee(amount, pixPayoutPercent, pixPayoutFixed, false);
  const manualWithdrawResult = calculateFee(amount, manualWithdrawPercent, manualWithdrawFixed, false);

  // USDT Purchase: aplicar taxa sobre o valor em BRL
  const usdtBaseValueBRL = usdtAmount * exchangeRate;
  const usdtPurchaseResult = calculateFee(usdtBaseValueBRL, usdtPurchasePercent, usdtPurchaseFixed, true);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Teste de Taxas</h1>
        <p className="text-gray-600 mt-2">
          Simulador para testar o funcionamento das taxas configuradas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h2>

            {/* Base Values */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor BRL
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Câmbio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="5.85"
                />
              </div>
            </div>

            {/* PIX Pay-in */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">PIX Pay-in (Depósitos)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% Taxa</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pixPayinPercent}
                    onChange={(e) => setPixPayinPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Taxa Fixa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pixPayinFixed}
                    onChange={(e) => setPixPayinFixed(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* PIX Pay-out */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">PIX Pay-out (Saques API)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% Taxa</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pixPayoutPercent}
                    onChange={(e) => setPixPayoutPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Taxa Fixa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pixPayoutFixed}
                    onChange={(e) => setPixPayoutFixed(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Manual Withdrawal */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Saque Manual</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% Taxa</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualWithdrawPercent}
                    onChange={(e) => setManualWithdrawPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Taxa Fixa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualWithdrawFixed}
                    onChange={(e) => setManualWithdrawFixed(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* USDT Purchase */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Compra USDT</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">USDT Amount</label>
                  <input
                    type="number"
                    step="0.1"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% Taxa</label>
                  <input
                    type="number"
                    step="0.1"
                    value={usdtPurchasePercent}
                    onChange={(e) => setUsdtPurchasePercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Taxa Fixa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={usdtPurchaseFixed}
                    onChange={(e) => setUsdtPurchaseFixed(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* PIX Pay-in Result */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">
              📥 PIX Pay-in (Depósito) - Taxa Descontada
            </h3>
            <div className="text-sm space-y-1">
              <div>Valor recebido: <span className="font-medium">{formatCurrency(amount)}</span></div>
              <div className="text-blue-700">
                Taxa: {formatPercent(pixPayinPercent)} + {formatCurrency(pixPayinFixed)} = {formatCurrency(pixPayinResult.feeAmount)}
              </div>
              <div className="text-lg font-bold text-blue-900">
                Valor final: {formatCurrency(pixPayinResult.finalAmount)}
              </div>
            </div>
          </div>

          {/* PIX Pay-out Result */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3">
              📤 PIX Pay-out (Saque API) - Taxa Descontada
            </h3>
            <div className="text-sm space-y-1">
              <div>Valor solicitado: <span className="font-medium">{formatCurrency(amount)}</span></div>
              <div className="text-red-700">
                Taxa: {formatPercent(pixPayoutPercent)} + {formatCurrency(pixPayoutFixed)} = {formatCurrency(pixPayoutResult.feeAmount)}
              </div>
              <div className="text-lg font-bold text-red-900">
                Valor enviado: {formatCurrency(pixPayoutResult.finalAmount)}
              </div>
            </div>
          </div>

          {/* Manual Withdrawal Result */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-3">
              🏧 Saque Manual - Taxa Descontada
            </h3>
            <div className="text-sm space-y-1">
              <div>Valor solicitado: <span className="font-medium">{formatCurrency(amount)}</span></div>
              <div className="text-orange-700">
                Taxa: {formatPercent(manualWithdrawPercent)} + {formatCurrency(manualWithdrawFixed)} = {formatCurrency(manualWithdrawResult.feeAmount)}
              </div>
              <div className="text-lg font-bold text-orange-900">
                Valor recebido: {formatCurrency(manualWithdrawResult.finalAmount)}
              </div>
            </div>
          </div>

          {/* USDT Purchase Result */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">
              💰 Compra USDT - Taxa Adicionada
            </h3>
            <div className="text-sm space-y-1">
              <div>{usdtAmount} USDT × {formatCurrency(exchangeRate)} = <span className="font-medium">{formatCurrency(usdtBaseValueBRL)}</span></div>
              <div className="text-green-700">
                Taxa: {formatPercent(usdtPurchasePercent)} + {formatCurrency(usdtPurchaseFixed)} = {formatCurrency(usdtPurchaseResult.feeAmount)}
              </div>
              <div className="text-lg font-bold text-green-900">
                Total a pagar: {formatCurrency(usdtPurchaseResult.finalAmount)}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">📊 Resumo das Regras</h3>
            <div className="text-sm space-y-2 text-gray-700">
              <div>• <strong>PIX Pay-in:</strong> Taxa descontada do valor recebido</div>
              <div>• <strong>PIX Pay-out:</strong> Taxa descontada do valor que sai</div>
              <div>• <strong>Saque Manual:</strong> Taxa descontada do saque</div>
              <div>• <strong>Compra USDT:</strong> Taxa adicionada ao valor final</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}