import { CurrencyCode, Expense } from '../types';

/**
 * Standard reference exchange rates against 1 USD (Base USD = 1.0)
 * Fallback values in case network is unreachable.
 */
export const REFERENCE_RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  VND: 25450,
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

const CACHE_KEY = 'app_exchange_rates_cache_v2';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

interface StoredRatesCache {
  rates: Record<CurrencyCode, number>;
  timestamp: number;
  lastUpdatedDateStr: string;
}

// In-memory cache initialized from localStorage or defaults
let memoryRates: Record<CurrencyCode, number> = { ...REFERENCE_RATES_TO_USD };
let memoryLastUpdated: number = 0;
let memoryLastUpdatedDateStr: string = 'Đang tải...';

function initializeRatesFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed: StoredRatesCache = JSON.parse(raw);
      if (parsed && parsed.rates && typeof parsed.timestamp === 'number') {
        memoryRates = { ...REFERENCE_RATES_TO_USD, ...parsed.rates };
        memoryLastUpdated = parsed.timestamp;
        memoryLastUpdatedDateStr = parsed.lastUpdatedDateStr || new Date(parsed.timestamp).toLocaleDateString('vi-VN');
      }
    }
  } catch (e) {
    console.warn('Failed to load exchange rates from storage', e);
  }
}

// Run initial storage check
initializeRatesFromStorage();

/**
 * Get current rates cache info for UI display
 */
export function getRatesCacheInfo(): {
  lastUpdatedText: string;
  isRecent: boolean;
  needsUpdate: boolean;
  rates: Record<CurrencyCode, number>;
} {
  const isRecent = memoryLastUpdated > 0;
  const elapsed = Date.now() - memoryLastUpdated;
  const needsUpdate = !isRecent || elapsed >= THREE_DAYS_MS;

  return {
    lastUpdatedText: isRecent 
      ? memoryLastUpdatedDateStr 
      : 'Tham chiếu mặc định',
    isRecent,
    needsUpdate,
    rates: { ...memoryRates }
  };
}

/**
 * Fetch live exchange rates from open exchange API.
 * Automatically respects 3-day caching policy unless force=true.
 */
export async function fetchLiveExchangeRates(force: boolean = false): Promise<{
  rates: Record<CurrencyCode, number>;
  lastUpdatedText: string;
  isLive: boolean;
}> {
  const now = Date.now();
  // If not forcing and cache is within 3 days, return cached rates directly
  if (!force && memoryLastUpdated > 0 && (now - memoryLastUpdated) < THREE_DAYS_MS) {
    return {
      rates: { ...memoryRates },
      lastUpdatedText: memoryLastUpdatedDateStr,
      isLive: true
    };
  }

  try {
    // Free open exchange rate API without key requirement
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data && data.rates) {
      const newRates: Record<CurrencyCode, number> = { ...REFERENCE_RATES_TO_USD };
      const supportedCurrencies: CurrencyCode[] = [
        'USD', 'VND', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'SGD', 'KRW', 'CNY', 'THB'
      ];

      supportedCurrencies.forEach((code) => {
        if (typeof data.rates[code] === 'number') {
          newRates[code] = data.rates[code];
        }
      });

      const dateStr = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      memoryRates = newRates;
      memoryLastUpdated = now;
      memoryLastUpdatedDateStr = dateStr;

      // Save to localStorage
      try {
        const cachePayload: StoredRatesCache = {
          rates: newRates,
          timestamp: now,
          lastUpdatedDateStr: dateStr
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
      } catch (e) {
        console.warn('Failed to cache exchange rates to localStorage', e);
      }

      return {
        rates: newRates,
        lastUpdatedText: dateStr,
        isLive: true
      };
    }
  } catch (error) {
    console.warn('Could not fetch real-time exchange rates, using cached/fallback:', error);
  }

  return {
    rates: { ...memoryRates },
    lastUpdatedText: memoryLastUpdated > 0 ? memoryLastUpdatedDateStr : 'Tỷ giá tham chiếu',
    isLive: false
  };
}

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

  // Use dynamic rates (live / cached / fallback)
  const fromRateInUSD = memoryRates[from] || REFERENCE_RATES_TO_USD[from] || 1;
  const toRateInUSD = memoryRates[to] || REFERENCE_RATES_TO_USD[to] || 1;

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
 * Format a readable exchange rate note, e.g. "1 USD ≈ 25.450 VND"
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
