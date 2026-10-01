import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CurrencyCode, CURRENCY_OPTIONS } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let activeCurrencyCode: CurrencyCode = 'VND';
let activePrivacyMode: boolean = false;

// Synchronously initialize from localStorage on module load
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('expense_tracker_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.currency) activeCurrencyCode = parsed.currency;
      if (typeof parsed.privacyMode === 'boolean') activePrivacyMode = parsed.privacyMode;
    }
  }
} catch {
  // Ignore fallback error
}

export function setGlobalCurrency(currency: CurrencyCode) {
  activeCurrencyCode = currency;
}

export function setGlobalPrivacyMode(privacy: boolean) {
  activePrivacyMode = privacy;
}

export function getGlobalCurrency(): CurrencyCode {
  return activeCurrencyCode;
}

export function getGlobalPrivacyMode(): boolean {
  return activePrivacyMode;
}

export function formatCurrency(
  amount: number,
  currency?: CurrencyCode,
  masked?: boolean
): string {
  const isMasked = masked !== undefined ? masked : activePrivacyMode;
  if (isMasked) return '••••••';
  
  const targetCurrency = currency || activeCurrencyCode;
  const option = CURRENCY_OPTIONS.find(c => c.code === targetCurrency) || CURRENCY_OPTIONS[0];
  
  try {
    return new Intl.NumberFormat(option.locale, {
      style: 'currency',
      currency: option.code,
      maximumFractionDigits: option.fractionDigits,
      minimumFractionDigits: option.fractionDigits > 0 ? option.fractionDigits : 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${option.symbol}`;
  }
}

export function formatCompactCurrency(
  amount: number,
  currency?: CurrencyCode,
  masked?: boolean
): string {
  const isMasked = masked !== undefined ? masked : activePrivacyMode;
  if (isMasked) return '••••';
  
  const targetCurrency = currency || activeCurrencyCode;
  const option = CURRENCY_OPTIONS.find(c => c.code === targetCurrency) || CURRENCY_OPTIONS[0];

  if (targetCurrency === 'VND') {
    if (Math.abs(amount) >= 1_000_000_000) {
      const b = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
      return `${b}tỷ`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      const m = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `${m}tr`;
    }
    if (Math.abs(amount) >= 1_000) {
      const k = (amount / 1_000).toFixed(0);
      return `${k}k`;
    }
    return `${amount}đ`;
  }

  // Non-VND compact formatting (USD, EUR, GBP, JPY)
  try {
    return new Intl.NumberFormat(option.locale, {
      style: 'currency',
      currency: option.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${amount} ${option.symbol}`;
  }
}

/**
 * Shifts a 'YYYY-MM' string by offset months
 */
export function shiftMonth(monthStr: string, offset: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1 + offset, 1);
  const newY = date.getFullYear();
  const newM = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${newY}-${newM}`;
}

/**
 * Formats a list of YYYY-MM months into a concise range string (e.g. "T10 → T12/26")
 */
export function formatMonthRange(months: string[]): string {
  if (!months || months.length === 0) return '';
  const sorted = [...months].sort();
  if (sorted.length === 1) {
    const [y, m] = sorted[0].split('-');
    return `T${m}/${y.slice(-2)}`;
  }
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const [y1, m1] = first.split('-');
  const [y2, m2] = last.split('-');
  if (y1 === y2) {
    return `T${m1} → T${m2}/${y1.slice(-2)}`;
  }
  return `T${m1}/${y1.slice(-2)} → T${m2}/${y2.slice(-2)}`;
}

/**
 * Formats a numeric input value with thousand separators (e.g. 2000000 -> 2.000.000)
 */
export function formatNumberWithSeparators(
  val: string | number,
  currency?: CurrencyCode
): string {
  if (val === '' || val === null || val === undefined) return '';
  const str = String(val);
  const targetCurrency = currency || activeCurrencyCode;
  const option = CURRENCY_OPTIONS.find(c => c.code === targetCurrency) || CURRENCY_OPTIONS[0];
  const isZeroDecimal = option.fractionDigits === 0;

  if (isZeroDecimal) {
    // Only digits, separated by dots (standard in Vietnam: 2.000.000)
    const digits = str.replace(/\D/g, '');
    if (!digits) return '';
    const trimmed = digits.replace(/^0+(?=\d)/, '');
    return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    // Decimal currency (e.g. USD, EUR)
    // If user typed decimal dot or comma:
    const hasDecimal = /[.,]/.test(str);
    if (!hasDecimal) {
      const digits = str.replace(/\D/g, '');
      if (!digits) return '';
      const trimmed = digits.replace(/^0+(?=\d)/, '');
      return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    const parts = str.split(/[.,]/);
    const intDigits = parts[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
    const formattedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decDigits = parts.slice(1).join('').replace(/\D/g, '').slice(0, option.fractionDigits);
    return str.endsWith('.') || str.endsWith(',') 
      ? `${formattedInt}.` 
      : `${formattedInt}.${decDigits}`;
  }
}

/**
 * Parses a thousand-separated string back to a raw floating/integer number
 */
export function parseFormattedNumber(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
  if (!str) return 0;

  // If contains both comma and dot, e.g. 1,234.56 or 1.234,56
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf('.') > str.lastIndexOf(',')) {
      // 1,234.56
      const num = parseFloat(str.replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    } else {
      // 1.234,56
      const num = parseFloat(str.replace(/\./g, '').replace(/,/g, '.'));
      return isNaN(num) ? 0 : num;
    }
  }

  // If contains only dots (e.g. "2.000.000") -> all dots are thousand separators
  if (str.includes('.')) {
    const num = parseFloat(str.replace(/\./g, ''));
    return isNaN(num) ? 0 : num;
  }

  // If contains only commas
  if (str.includes(',')) {
    // Check if it's thousand separator (e.g. "2,000,000") or decimal (e.g. "2,5")
    const parts = str.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      const num = parseFloat(str.replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    } else {
      const num = parseFloat(str.replace(/,/g, '.'));
      return isNaN(num) ? 0 : num;
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

