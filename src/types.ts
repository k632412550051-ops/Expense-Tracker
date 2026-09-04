export type Category = string;

export const DEFAULT_CATEGORIES: Category[] = [
  'Ăn ngoài',
  'Chi tiêu phát sinh',
  'Đi lại',
  'Chi tiêu bắt buộc',
  'Social & Networking',
  'Khác'
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  'Giải ngân công việc',
  'Nhận tiền trả hộ/trả nợ',
  'Hoàn tiền',
  'Khác'
];

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  // Khoản chi
  'Ăn ngoài': '#F59E0B',           // Vàng/Amber
  'Ăn uống': '#F59E0B',
  'Đi lại': '#F97316',             // Cam
  'Chi tiêu bắt buộc': '#EF4444',   // Đỏ san hô
  'Social & Networking': '#3B82F6', // Xanh dương
  'Chi tiêu phát sinh': '#8B5CF6',  // Tím
  'Khác': '#6B7280',               // Xám
  // Khoản thu
  'Giải ngân công việc': '#10B981',   // Xanh lá / Emerald
  'Nhận tiền trả hộ/trả nợ': '#10B981',
  'Hoàn tiền': '#10B981',
};

export const PRESET_CATEGORY_COLORS = [
  '#F59E0B', // Vàng / Amber
  '#F97316', // Cam
  '#EF4444', // Đỏ san hô
  '#3B82F6', // Xanh dương
  '#8B5CF6', // Tím
  '#EC4899', // Hồng
  '#06B6D4', // Cyan
  '#10B981', // Xanh lá
  '#6366F1', // Chàm (Indigo)
  '#84CC16', // Xanh cốm (Lime)
  '#6B7280', // Xám
];

export function getCategoryColor(
  category: string, 
  type: 'income' | 'expense' = 'expense', 
  customColors?: Record<string, string>
): string {
  if (customColors && customColors[category]) {
    return customColors[category];
  }
  if (DEFAULT_CATEGORY_COLORS[category]) {
    return DEFAULT_CATEGORY_COLORS[category];
  }
  if (type === 'income') {
    return '#10B981';
  }
  // Deterministic fallback based on category name
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_CATEGORY_COLORS.length;
  return PRESET_CATEGORY_COLORS[index];
}

export interface Expense {
  id: string;
  amount: number;
  currency?: CurrencyCode; // Currency the expense was made in (defaults to app base currency)
  exchangeRate?: number; // Exchange rate to base currency at the time of transaction
  convertedAmount?: number; // Converted amount in base currency for consistent charts & budgets
  category: Category;
  date: string; // YYYY-MM-DD format
  note: string;
  type?: 'income' | 'expense';
  isReimbursable?: boolean;
  isResolved?: boolean;
}

export type BudgetMap = Record<Category, number>;

export const DEFAULT_BUDGETS: BudgetMap = {
  'Ăn ngoài': 3000000,
  'Chi tiêu phát sinh': 1000000,
  'Đi lại': 1000000,
  'Chi tiêu bắt buộc': 5000000,
  'Social & Networking': 2000000,
  'Khác': 1000000
};

export type CurrencyCode = 
  | 'VND' 
  | 'USD' 
  | 'EUR' 
  | 'JPY' 
  | 'GBP' 
  | 'AUD' 
  | 'CAD' 
  | 'SGD' 
  | 'KRW' 
  | 'CNY' 
  | 'THB';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PersonaType = 'student' | 'worker' | 'nomad' | 'family';

export interface UserProfile {
  displayName?: string;
  persona?: PersonaType;
  baseCurrency?: CurrencyCode;
  frequentCurrencies?: CurrencyCode[];
  monthlyBudget?: number;
  onboarded?: boolean;
}

export interface AppSettings {
  currency: CurrencyCode; // Base currency (defaults to VND)
  theme: ThemeMode;
  privacyMode: boolean;
  travelCurrency?: CurrencyCode; // Quick currency for spending while abroad/traveling
  customExchangeRates?: Record<string, number>; // Pair like "USD_VND" => 25400
}

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  fractionDigits: number;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'VND', symbol: '₫', name: 'Việt Nam Đồng', flag: '🇻🇳', locale: 'vi-VN', fractionDigits: 0 },
  { code: 'USD', symbol: '$', name: 'Đô la Mỹ', flag: '🇺🇸', locale: 'en-US', fractionDigits: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE', fractionDigits: 2 },
  { code: 'JPY', symbol: '¥', name: 'Yên Nhật', flag: '🇯🇵', locale: 'ja-JP', fractionDigits: 0 },
  { code: 'GBP', symbol: '£', name: 'Bảng Anh', flag: '🇬🇧', locale: 'en-GB', fractionDigits: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Đô la Úc', flag: '🇦🇺', locale: 'en-AU', fractionDigits: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Đô la Canada', flag: '🇨🇦', locale: 'en-CA', fractionDigits: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Đô la Singapore', flag: '🇸🇬', locale: 'en-SG', fractionDigits: 2 },
  { code: 'KRW', symbol: '₩', name: 'Won Hàn Quốc', flag: '🇰🇷', locale: 'ko-KR', fractionDigits: 0 },
  { code: 'CNY', symbol: '¥', name: 'Nhân dân tệ', flag: '🇨🇳', locale: 'zh-CN', fractionDigits: 2 },
  { code: 'THB', symbol: '฿', name: 'Baht Thái', flag: '🇹🇭', locale: 'th-TH', fractionDigits: 2 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'VND',
  theme: 'system',
  privacyMode: false,
};
