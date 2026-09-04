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
