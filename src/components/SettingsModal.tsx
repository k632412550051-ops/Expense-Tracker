import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  X, 
  Moon, 
  Sun, 
  Laptop, 
  Coins, 
  Check, 
  User, 
  LogOut, 
  Eye, 
  EyeOff, 
  Sliders, 
  ChevronRight,
  TrendingUp,
  Sparkles,
  Plane,
  Calendar as CalendarIcon,
  BellRing,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { AppSettings, CurrencyCode, CURRENCY_OPTIONS, UserProfile, Expense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getExchangeRate, fetchLiveExchangeRates, getRatesCacheInfo } from '../lib/exchangeRates';
import { 
  isGoogleCalendarConnected, 
  connectGoogleCalendar, 
  disconnectGoogleCalendar 
} from '../lib/googleCalendar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
  userProfile?: UserProfile | null;
  onUpdateProfile?: (data: Partial<UserProfile>) => Promise<void>;
  onOpenBudgetModal: () => void;
  onLogout: () => void;
  expenses?: Expense[];
  onSyncExpensesCalendar?: () => Promise<number>;
  onShowNotification?: (msg: string, type?: 'success' | 'error') => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  user,
  userProfile,
  onUpdateProfile,
  onOpenBudgetModal,
  onLogout,
  expenses = [],
  onSyncExpensesCalendar,
  onShowNotification
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'currency' | 'appearance' | 'calendar'>('general');
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(() => isGoogleCalendarConnected());

  // Real-time exchange rate state (auto updates 3 days/time, with manual trigger)
  const [ratesInfo, setRatesInfo] = useState(() => getRatesCacheInfo());
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [rateDisplayMode, setRateDisplayMode] = useState<'perVND' | 'perForeign'>('perVND');

  const handleRefreshRates = async () => {
    try {
      setIsUpdatingRates(true);
      await fetchLiveExchangeRates(true);
      setRatesInfo(getRatesCacheInfo());
      onShowNotification?.('Đã cập nhật tỷ giá thị trường thời gian thực! 💱');
    } catch (err: any) {
      onShowNotification?.('Không thể lấy tỷ giá mới lúc này.', 'error');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleToggleCalendar = async (checked: boolean) => {
    if (checked) {
      try {
        setIsConnectingCalendar(true);
        await connectGoogleCalendar();
        setCalendarConnected(true);
        onUpdateSettings({ calendarAutoSync: true });
        onShowNotification?.('Đã bật đồng bộ Google Calendar! 📅');
      } catch (err: any) {
        setCalendarConnected(false);
        onUpdateSettings({ calendarAutoSync: false });
        onShowNotification?.(err?.message || 'Không thể kết nối Google Calendar', 'error');
      } finally {
        setIsConnectingCalendar(false);
      }
    } else {
      disconnectGoogleCalendar();
      setCalendarConnected(false);
      onUpdateSettings({ calendarAutoSync: false });
      onShowNotification?.('Đã tắt đồng bộ Google Calendar.');
    }
  };

  const userInitial = user.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : user.email 
      ? user.email.charAt(0).toUpperCase() 
      : 'U';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            key="settings-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="liquid-glass-elevated w-full max-w-lg h-[580px] max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/80 dark:border-white/10 dark:bg-slate-900/95 flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Specular line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 shrink-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
                  <SettingsIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black font-heading text-slate-900 dark:text-white tracking-tight">
                    Cài đặt
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Quản lý tài khoản, tiền tệ và giao diện
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Tabs - shrink-0 ensures tabs never clip when switching tabs */}
            <div className="flex items-center gap-1.5 px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 overflow-x-auto shrink-0 z-10">
              <button
                onClick={() => setActiveTab('general')}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
                  activeTab === 'general'
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {activeTab === 'general' && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <User className="w-3.5 h-3.5" />
                <span>Tài khoản</span>
              </button>

              <button
                onClick={() => setActiveTab('currency')}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
                  activeTab === 'currency'
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {activeTab === 'currency' && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Coins className="w-3.5 h-3.5" />
                <span>Tiền tệ ({settings.currency})</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
                  activeTab === 'appearance'
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {activeTab === 'appearance' && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giao diện</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
                  activeTab === 'calendar'
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {activeTab === 'calendar' && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Google Calendar</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 relative overscroll-contain">
              <AnimatePresence mode="wait" initial={false}>
                {/* TAB 1: GENERAL & ACCOUNT */}
                {activeTab === 'general' && (
                  <motion.div 
                    key="tab-general"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    {/* Account Card */}
                    <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt="User Avatar" 
                            className="w-11 h-11 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-base flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-xs shrink-0">
                            {userInitial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user.displayName || 'Người dùng Google'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email || 'Đã đăng nhập'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={onLogout}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Đăng xuất"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Đăng xuất</span>
                      </button>
                    </div>

                    {/* Privacy Mode Toggle */}
                    <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                          settings.privacyMode 
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {settings.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Chế độ riêng tư
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Ẩn số tiền khi mở ứng dụng ở nơi đông người
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.privacyMode}
                          onChange={(e) => onUpdateSettings({ privacyMode: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Budget & Category Management Entry Point */}
                    <div 
                      onClick={() => {
                        onClose();
                        onOpenBudgetModal();
                      }}
                      className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Ngân sách & Danh mục
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Định mức hàng tháng, danh mục Thu - Chi và màu sắc
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: CURRENCY & EXCHANGE RATES */}
                {activeTab === 'currency' && (
                  <motion.div 
                    key="tab-currency"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    {/* Section 1: Base Currency */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                          Đồng tiền cơ sở (Báo cáo & Tổng kết)
                        </h3>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                          Hiện tại: {settings.currency}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {CURRENCY_OPTIONS.map((c) => {
                          const isSelected = settings.currency === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ currency: c.code });
                                onUpdateProfile?.({ baseCurrency: c.code });
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                                  : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xl">{c.flag}</span>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                                    {c.code} ({c.symbol})
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                                    {c.name}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Frequent Currencies */}
                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Plane className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Ngoại tệ thường dùng
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                        Lưu vào danh sách ngoại tệ yêu thích khi du học hoặc đi nước ngoài:
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {CURRENCY_OPTIONS.map((c) => {
                          const currentFrequent = userProfile?.frequentCurrencies || ['VND', 'USD'];
                          const isFrequent = currentFrequent.includes(c.code);
                          const isBase = settings.currency === c.code;

                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                if (isBase) return;
                                let updated: CurrencyCode[];
                                if (isFrequent) {
                                  updated = currentFrequent.filter(code => code !== c.code);
                                } else {
                                  updated = [...currentFrequent, c.code];
                                }
                                onUpdateProfile?.({ frequentCurrencies: updated });
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border",
                                isFrequent
                                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                                  : "bg-white/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300"
                              )}
                            >
                              <span>{c.flag}</span>
                              <span>{c.code}</span>
                              {isFrequent && !isBase && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 3: Live Exchange Rates with 3-day update policy */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              Tỷ giá thị trường thời gian thực
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Chu kỳ cập nhật 3 ngày/lần • Lần cuối: <span className="font-semibold text-slate-700 dark:text-slate-300">{ratesInfo.lastUpdatedText}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {/* Toggle view: theo 1 VND vs theo 1 Ngoại tệ */}
                          <div className="p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setRateDisplayMode('perVND')}
                              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                rateDisplayMode === 'perVND'
                                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-cyan-400 shadow-2xs font-extrabold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              Theo 1 VND
                            </button>
                            <button
                              type="button"
                              onClick={() => setRateDisplayMode('perForeign')}
                              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                rateDisplayMode === 'perForeign'
                                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-cyan-400 shadow-2xs font-extrabold'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                              }`}
                            >
                              Theo 1 Ngoại tệ
                            </button>
                          </div>

                          {/* Manual refresh button */}
                          <button
                            type="button"
                            disabled={isUpdatingRates}
                            onClick={handleRefreshRates}
                            title="Làm mới tỷ giá ngay lập tức"
                            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", isUpdatingRates && "animate-spin")} />
                          </button>
                        </div>
                      </div>

                      {/* Exchange rates grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CURRENCY_OPTIONS.filter(c => c.code !== 'VND').map(c => {
                          if (rateDisplayMode === 'perVND') {
                            const rateFromVND = getExchangeRate('VND', c.code);
                            let formattedRate: string;
                            if (rateFromVND < 0.0001) {
                              formattedRate = rateFromVND.toFixed(6);
                            } else if (rateFromVND < 0.01) {
                              formattedRate = rateFromVND.toFixed(4);
                            } else {
                              formattedRate = rateFromVND.toFixed(2);
                            }

                            return (
                              <div key={c.code} className="p-2.5 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                  <span>1 VND</span>
                                  <span>{c.flag} {c.code}</span>
                                </span>
                                <span className="text-xs font-black text-blue-600 dark:text-cyan-400 mt-1 truncate">
                                  ≈ {formattedRate} {c.code}
                                </span>
                              </div>
                            );
                          } else {
                            const rateToVND = getExchangeRate(c.code, 'VND');
                            return (
                              <div key={c.code} className="p-2.5 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <span>{c.flag}</span> 1 {c.code}
                                </span>
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                                  ≈ {Math.round(rateToVND).toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: THEME / APPEARANCE */}
                {activeTab === 'appearance' && (
                  <motion.div 
                    key="tab-appearance"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-3 pt-1">
                      {/* Light */}
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ theme: 'light' })}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                          settings.theme === 'light'
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Sáng</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Crystal Light</p>
                        </div>
                      </button>

                      {/* Dark */}
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ theme: 'dark' })}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                          settings.theme === 'dark'
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Tối</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Obsidian Glass</p>
                        </div>
                      </button>

                      {/* System */}
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ theme: 'system' })}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                          settings.theme === 'system'
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-500 dark:text-slate-300 flex items-center justify-center border border-slate-500/20">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Hệ thống</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Tự động</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: GOOGLE CALENDAR - REFACTORED CLEAN UI WITH MASTER ON/OFF TOGGLE */}
                {activeTab === 'calendar' && (
                  <motion.div 
                    key="tab-calendar"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="space-y-3.5"
                  >
                    {/* Master Turn ON / OFF Switch Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs transition-colors",
                            calendarConnected
                              ? "bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-400 border-blue-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                          )}>
                            <CalendarIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                Đồng bộ Google Calendar
                              </h4>
                              {calendarConnected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Đang bật
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                                  Đang tắt
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {calendarConnected 
                                ? (user.email ? `Liên kết với ${user.email}` : 'Tự động tạo lịch nhắc chi tiêu cần đòi / hoàn tiền')
                                : 'Bật để tự động nhắc lịch các khoản chi ứng trước trên Google Calendar'}
                            </p>
                          </div>
                        </div>

                        {/* Single Master Toggle Switch (Turn ON / OFF) */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isConnectingCalendar && (
                            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                          )}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={isConnectingCalendar}
                              checked={calendarConnected}
                              onChange={(e) => handleToggleCalendar(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600 disabled:opacity-50"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Extended options only shown when ON */}
                    {calendarConnected ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {/* 1. Default reminder lead time */}
                        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-700/60 shadow-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                              Thời gian hẹn nhắc hoàn tiền mặc định
                            </h5>
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                              Sau {settings.calendarReminderDays || 3} ngày
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { days: 3, label: '3 ngày' },
                              { days: 5, label: '5 ngày' },
                              { days: 7, label: '1 tuần' },
                              { days: 14, label: '2 tuần' },
                            ].map((opt) => {
                              const isSelected = (settings.calendarReminderDays || 3) === opt.days;
                              return (
                                <button
                                  key={opt.days}
                                  type="button"
                                  onClick={() => onUpdateSettings({ calendarReminderDays: opt.days })}
                                  className={cn(
                                    "py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                                    isSelected
                                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border-blue-500 ring-1 ring-blue-500/20"
                                      : "bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
                                  )}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Batch Sync Pending Reimbursements */}
                        {onSyncExpensesCalendar && (
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-slate-800/80 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                Đồng bộ khoản chi đang chờ
                              </h5>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                {expenses.filter(e => e.isReimbursable && !e.calendarEventId && !e.isResolved).length > 0
                                  ? `Có ${expenses.filter(e => e.isReimbursable && !e.calendarEventId && !e.isResolved).length} khoản chi chờ hoàn tiền chưa lên lịch.`
                                  : 'Tất cả các khoản chi hoàn tiền đã được đồng bộ lên Google Calendar.'}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isSyncingAll}
                              onClick={async () => {
                                try {
                                  setIsSyncingAll(true);
                                  const count = await onSyncExpensesCalendar();
                                  if (count > 0) {
                                    onShowNotification?.(`Đã đồng bộ ${count} khoản chi lên Google Calendar! 📅`);
                                  } else {
                                    onShowNotification?.('Tất cả các khoản chi hoàn tiền đã được đồng bộ từ trước.');
                                  }
                                } catch (e: any) {
                                  onShowNotification?.(e?.message || 'Có lỗi khi đồng bộ lịch.', 'error');
                                } finally {
                                  setIsSyncingAll(false);
                                }
                              }}
                              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <RefreshCw className={cn("w-3.5 h-3.5", isSyncingAll && "animate-spin")} />
                              <span>{isSyncingAll ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                            </button>
                          </div>
                        )}

                        {/* 3. Concise informative guidelines */}
                        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">📌 Cách thức hoạt động:</p>
                          <p>• Nhắc nhở qua thông báo vào 09:00 sáng ngày hẹn trên ứng dụng Google Calendar.</p>
                          <p>• Khi bạn bấm [Đã nhận tiền] trong lịch sử, sự kiện Google Calendar sẽ tự động đổi thành [Đã hoàn tiền ✓].</p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                        Tính năng đồng bộ lịch hiện đang tắt. Gạt công tắc sang Bật để tự động nhắc lịch các khoản chi cần hoàn tiền.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <a
                  href="/about.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 underline transition-colors"
                >
                  Giới thiệu
                </a>
                <span>•</span>
                <a
                  href="/privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 underline transition-colors"
                >
                  Chính sách quyền riêng tư
                </a>
                <span>•</span>
                <a
                  href="/terms.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 underline transition-colors"
                >
                  Điều khoản
                </a>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
