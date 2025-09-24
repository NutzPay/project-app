/**
 * Utilidade central para formatação de valores monetários
 * Segue o padrão brasileiro de formatação
 */

export interface CurrencyFormatOptions {
  /** Mostrar símbolo da moeda */
  showSymbol?: boolean;
  /** Número mínimo de casas decimais */
  minimumFractionDigits?: number;
  /** Número máximo de casas decimais */
  maximumFractionDigits?: number;
}

/**
 * Formatar valor em Real brasileiro (R$)
 * @param value - Valor numérico
 * @param options - Opções de formatação
 * @returns Valor formatado como R$ 1.234,56
 */
export function formatBRL(value: number | string, options: CurrencyFormatOptions = {}): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return showSymbol ? 'R$ 0,00' : '0,00';
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericValue);

  return showSymbol ? `R$ ${formatted}` : formatted;
}

/**
 * Formatar valor em USDT ou outras criptomoedas
 * @param value - Valor numérico
 * @param currency - Nome da moeda (ex: 'USDT', 'BTC')
 * @param options - Opções de formatação
 * @returns Valor formatado como 1.234,56 USDT
 */
export function formatCrypto(
  value: number | string, 
  currency: string = 'USDT', 
  options: CurrencyFormatOptions = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 6
  } = options;

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return showSymbol ? `0,00 ${currency}` : '0,00';
  }

  // Validate fraction digits to prevent RangeError
  const validMinFractionDigits = Math.max(0, Math.min(20, minimumFractionDigits));
  const validMaxFractionDigits = Math.max(0, Math.min(20, maximumFractionDigits));

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: validMinFractionDigits,
    maximumFractionDigits: Math.max(validMinFractionDigits, validMaxFractionDigits)
  }).format(numericValue);

  return showSymbol ? `${formatted} ${currency}` : formatted;
}

/**
 * Formatar valor em USD
 * @param value - Valor numérico
 * @param options - Opções de formatação
 * @returns Valor formatado como US$ 1.234,56
 */
export function formatUSD(value: number | string, options: CurrencyFormatOptions = {}): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return showSymbol ? 'US$ 0,00' : '0,00';
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericValue);

  return showSymbol ? `US$ ${formatted}` : formatted;
}

/**
 * Formatar números grandes com abreviações (K, M, B)
 * @param value - Valor numérico
 * @param currency - Moeda (BRL, USD, USDT, etc.)
 * @returns Valor formatado como R$ 1,2K, R$ 1,5M, etc.
 */
export function formatCompactCurrency(value: number | string, currency: 'BRL' | 'USD' | 'USDT' | string = 'BRL'): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return currency === 'BRL' ? 'R$ 0' : currency === 'USD' ? 'US$ 0' : `0 ${currency}`;
  }

  const absValue = Math.abs(numericValue);
  let formattedValue: string;
  let suffix = '';

  if (absValue >= 1000000000) {
    formattedValue = (numericValue / 1000000000).toFixed(1).replace('.', ',');
    suffix = 'B';
  } else if (absValue >= 1000000) {
    formattedValue = (numericValue / 1000000).toFixed(1).replace('.', ',');
    suffix = 'M';
  } else if (absValue >= 1000) {
    formattedValue = (numericValue / 1000).toFixed(1).replace('.', ',');
    suffix = 'K';
  } else {
    formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numericValue);
  }

  switch (currency) {
    case 'BRL':
      return `R$ ${formattedValue}${suffix}`;
    case 'USD':
      return `US$ ${formattedValue}${suffix}`;
    case 'USDT':
      return `${formattedValue}${suffix} USDT`;
    default:
      return `${formattedValue}${suffix} ${currency}`;
  }
}

/**
 * Formatar percentual no padrão brasileiro
 * @param value - Valor em decimal (0.1 = 10%)
 * @param options - Opções de formatação
 * @returns Valor formatado como 10,5%
 */
export function formatPercentage(value: number | string, options: CurrencyFormatOptions = {}): string {
  const {
    minimumFractionDigits = 1,
    maximumFractionDigits = 2
  } = options;

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return '0%';
  }

  const percentValue = numericValue * 100;
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(percentValue);

  return `${formatted}%`;
}

/**
 * Formatar qualquer valor monetário baseado no tipo de moeda
 * @param value - Valor numérico
 * @param currency - Tipo de moeda
 * @param options - Opções de formatação
 * @returns Valor formatado conforme a moeda
 */
export function formatCurrency(
  value: number | string, 
  currency: 'BRL' | 'USD' | 'USDT' | 'BTC' | 'ETH' | string, 
  options: CurrencyFormatOptions = {}
): string {
  switch (currency.toLowerCase()) {
    case 'brl':
    case 'real':
      return formatBRL(value, options);
    case 'usd':
    case 'dollar':
      return formatUSD(value, options);
    case 'usdt':
    case 'btc':
    case 'eth':
      return formatCrypto(value, currency.toUpperCase(), options);
    default:
      return formatCrypto(value, currency.toUpperCase(), options);
  }
}

/**
 * Parsing: converter string brasileira para número
 * @param value - String no formato brasileiro (ex: "1.234,56")
 * @returns Número convertido
 */
export function parseBRNumber(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  // Remove espaços e símbolos de moeda
  const cleaned = value
    .replace(/[R$\s]/g, '')
    .replace(/[A-Z]+/g, '') // Remove símbolos de crypto
    .trim();
  
  // Se tem vírgula, é decimal brasileiro
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2) {
      // Remove pontos da parte inteira (milhares)
      const integerPart = parts[0].replace(/\./g, '');
      const decimalPart = parts[1];
      return parseFloat(`${integerPart}.${decimalPart}`);
    }
  }
  
  // Se só tem pontos, pode ser milhares ou decimal
  if (cleaned.includes('.')) {
    const dots = cleaned.split('.').length - 1;
    if (dots === 1 && cleaned.split('.')[1].length <= 2) {
      // Provável decimal americano
      return parseFloat(cleaned);
    } else {
      // Provável separador de milhares
      return parseFloat(cleaned.replace(/\./g, ''));
    }
  }
  
  return parseFloat(cleaned) || 0;
}