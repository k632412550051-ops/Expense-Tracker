import { CurrencyCode, Expense } from '../types';

/**
 * Standard reference exchange rates against 1 USD (Base USD = 1.0)
 * Updated to representative rates for multi-currency conversion.
 */
export const REFERENCE_RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  VND: 25400,
  EUR: 0.92,
  JPY: 154.5,
  GBP: 0.78,
  AUD: 1.52,
  CAD: 1.38,
  SGD: 1.32,
  KRW: 1385,
  CNY: 7.25,
  THB: 36.5,
};

/**
 * Get exchange rate from one currency to another: 1 `from` = X `to`
 */
export function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  customRates?: Record<string, number>
): number {
  if (from === to) return 1;

  // Check custom rate pairs first: e.g. "USD_VND"
  const pairKey = `${from}_${to}`;
  if (customRates && customRates[pairKey] && customRates[pairKey] > 0) {
    return customRates[pairKey];
  }

  // Check inverse pair: e.g. "VND_USD"
  const inverseKey = `${to}_${from}`;
  if (customRates && customRates[inverseKey] && customRates[inverseKey] > 0) {
    return 1 / customRates[inverseKey];
  }

  // Fallback to reference rates
  const fromRateInUSD = REFERENCE_RATES_TO_USD[from] || 1;
  const toRateInUSD = REFERENCE_RATES_TO_USD[to] || 1;

  // 1 unit of 'from' = (toRateInUSD / fromRateInUSD) units of 'to'
  return toRateInUSD / fromRateInUSD;
}

/**
 * Convert an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  customRate?: number,
  customRatesMap?: Record<string, number>
): number {
  if (from === to) return amount;
  const rate = (customRate && customRate > 0) 
    ? customRate 
    : getExchangeRate(from, to, customRatesMap);
  return amount * rate;
}

/**
 * Calculate the converted amount of an expense in the app's target base currency.
 * Guarantees that charts, budgets, and balance totals always sum consistently.
 */
export function getExpenseConvertedAmount(
  expense: Pick<Expense, 'amount' | 'currency' | 'exchangeRate' | 'convertedAmount'>,
  baseCurrency: CurrencyCode,
  customRatesMap?: Record<string, number>
): number {
  const expenseCurrency = expense.currency || baseCurrency;
  if (expenseCurrency === baseCurrency) {
    return expense.amount;
  }

  if (expense.convertedAmount !== undefined && expense.convertedAmount > 0) {
    return expense.convertedAmount;
  }

  return convertCurrency(
    expense.amount,
    expenseCurrency,
    baseCurrency,
    expense.exchangeRate,
    customRatesMap
  );
}

/**
 * Format a readable exchange rate note, e.g. "1 USD ≈ 25.400 VND"
 */
export function formatExchangeRateDisplay(
  from: CurrencyCode,
  to: CurrencyCode,
  rate: number
): string {
  if (from === to) return `1 ${from} = 1 ${to}`;
  
  let formattedRate: string;
  if (rate >= 100) {
    formattedRate = Math.round(rate).toLocaleString('vi-VN');
  } else if (rate >= 1) {
    formattedRate = rate.toFixed(2);
  } else {
    formattedRate = rate.toFixed(4);
  }

  return `1 ${from} ≈ ${formattedRate} ${to}`;
}
