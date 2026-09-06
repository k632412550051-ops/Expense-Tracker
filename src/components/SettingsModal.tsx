import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Settings as SettingsIcon,
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
  ExternalLink,
  Languages
} from 'lucide-react';
import { 
  AppSettings, 
  CurrencyCode, 
  CURRENCY_OPTIONS, 
  UserProfile, 
  Expense, 
  LanguageCode, 
  SUPPORTED_LANGUAGES 
} from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getExchangeRate, fetchLiveExchangeRates, getRatesCacheInfo } from '../lib/exchangeRates';
import { 
  isGoogleCalendarConnected, 
  connectGoogleCalendar, 
  disconnectGoogleCalendar 
} from '../lib/googleCalendar';
import { changeAppLanguage } from '../i18n';

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
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'language' | 'currency' | 'appearance' | 'calendar'>('general');
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
      onShowNotification?.(t('settings.ratesUpdated', { defaultValue: 'Đã cập nhật tỷ giá thị trường thời gian thực! 💱' }));
    } catch (err: any) {
      onShowNotification?.(t('settings.ratesError', { defaultValue: 'Không thể lấy tỷ giá mới lúc này.' }), 'error');
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
        onShowNotification?.(t('settings.notifEnabled', { defaultValue: 'Đã bật tính năng thông báo hoàn tiền! 🔔' }));
      } catch (err: any) {
        setCalendarConnected(false);
        onUpdateSettings({ calendarAutoSync: false });
        onShowNotification?.(err?.message || t('settings.notifError', { defaultValue: 'Không thể bật thông báo' }), 'error');
      } finally {
        setIsConnectingCalendar(false);
      }
    } else {
      disconnectGoogleCalendar();
      setCalendarConnected(false);
      onUpdateSettings({ calendarAutoSync: false });
      onShowNotification?.(t('settings.notifDisabled', { defaultValue: 'Đã tắt thông báo.' }));
    }
  };

  const displayName = userProfile?.displayName || user.displayName || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const currentLanguageCode = (i18n.language?.slice(0, 2) as LanguageCode) || 'vi';

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
                    {t('settings.modalTitle', { defaultValue: 'Cài đặt hệ thống' })}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t('settings.modalSubtitle', { defaultValue: 'Quản lý tùy chọn, ngôn ngữ và tài khoản cá nhân' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tabs - shrink-0 ensures tabs never clip when switching */}
            <div className="flex items-center gap-1.5 px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 overflow-x-auto shrink-0 z-10 scrollbar-none">
              <button
                type="button"
                id="tab-btn-general"
                onClick={() => setActiveTab('general')}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
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
                <span>{t('settings.tabGeneral', { defaultValue: 'Chung' })}</span>
              </button>

              <button
                type="button"
                id="tab-btn-language"
                onClick={() => setActiveTab('language')}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
                  activeTab === 'language'
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {activeTab === 'language' && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Languages className="w-3.5 h-3.5" />
                <span>{t('settings.tabLanguage', { defaultValue: 'Ngôn ngữ' })}</span>
              </button>

              <button
                type="button"
                id="tab-btn-currency"
                onClick={() => setActiveTab('currency')}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
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
                <span>{t('settings.tabCurrency', { defaultValue: 'Tiền tệ' })} ({settings.currency})</span>
              </button>

              <button
                type="button"
                id="tab-btn-appearance"
                onClick={() => setActiveTab('appearance')}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
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
                <span>{t('settings.tabAppearance', { defaultValue: 'Giao diện' })}</span>
              </button>

              <button
                type="button"
                id="tab-btn-calendar"
                onClick={() => setActiveTab('calendar')}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 z-10",
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
                <BellRing className="w-3.5 h-3.5" />
                <span>{t('settings.tabNotifications', { defaultValue: 'Thông báo' })}</span>
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
                            {displayName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email || t('auth.signedIn', { defaultValue: 'Đã đăng nhập' })}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="settings-logout-btn"
                        onClick={onLogout}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        title={t('auth.signOut')}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('auth.signOut')}</span>
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
                            {t('settings.privacyModeTitle', { defaultValue: 'Chế độ riêng tư (Ẩn số tiền)' })}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('settings.privacyModeDesc', { defaultValue: 'Làm mờ số tiền để sử dụng an toàn ở nơi đông người' })}
                          </p>
                        </div>
                      </div>

                      <label htmlFor="privacy-mode-toggle" className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          id="privacy-mode-toggle"
                          name="privacy-mode-toggle"
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
                      id="settings-open-budget-btn"
                      onClick={() => {
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
                            {t('settings.budgetTitle', { defaultValue: 'Quản lý danh mục & hạn mức' })}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('settings.budgetDesc', { defaultValue: 'Thêm, sửa, đổi màu hoặc xóa danh mục thu chi' })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                    </div>
                  </motion.div>
                )}

                {/* TAB: LANGUAGE / NGÔN NGỮ */}
                {activeTab === 'language' && (
                  <motion.div 
                    key="tab-language"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                        {t('settings.languageTitle', { defaultValue: 'Ngôn ngữ hiển thị' })}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {t('settings.languageSubtitle', { defaultValue: 'Chọn ngôn ngữ hiển thị trong ứng dụng (tự động lưu vào thiết bị)' })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = currentLanguageCode === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            id={`settings-lang-${lang.code}`}
                            onClick={async () => {
                              await changeAppLanguage(lang.code);
                              onUpdateSettings({ language: lang.code });
                              onUpdateProfile?.({ language: lang.code });
                              onShowNotification?.(t('settings.languageUpdated', { defaultValue: 'Đã cập nhật ngôn ngữ giao diện!' }));
                            }}
                            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                                : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{lang.flag}</span>
                              <div className="text-left">
                                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                                  {lang.nativeName}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {lang.name}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
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
                          {t('settings.baseCurrencyTitle', { defaultValue: 'Đồng tiền cơ sở' })}
                        </h3>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                          {t('settings.currentCurrency', { defaultValue: 'Đồng tiền hiện tại' })}: {settings.currency}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {CURRENCY_OPTIONS.map((c) => {
                          const isSelected = settings.currency === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              id={`settings-base-curr-${c.code}`}
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
                          {t('settings.frequentCurrenciesTitle', { defaultValue: 'Ngoại tệ thường dùng' })}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                        {t('settings.frequentCurrenciesDesc', { defaultValue: 'Các loại tiền tệ hiển thị sẵn để chọn nhanh khi nhập chi tiêu' })}
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
                              id={`settings-freq-curr-${c.code}`}
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              {t('settings.liveRatesTitle')}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('settings.ratesCycle')} • {t('settings.lastUpdated')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{ratesInfo.lastUpdatedText}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRateDisplayMode(rateDisplayMode === 'perVND' ? 'perForeign' : 'perVND')}
                            className="text-[10px] font-bold px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer"
                          >
                            {rateDisplayMode === 'perVND' ? t('settings.perForeign', { defaultValue: 'Theo ngoại tệ' }) : t('settings.perVND', { defaultValue: 'Theo VND' })}
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingRates}
                            onClick={handleRefreshRates}
                            title={t('settings.refreshRates')}
                            className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", isUpdatingRates && "animate-spin")} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1">
                        {CURRENCY_OPTIONS.filter(c => c.code !== 'VND').map(c => {
                          const isPerVND = rateDisplayMode === 'perVND';
                          const rate = isPerVND ? getExchangeRate('VND', c.code) : getExchangeRate(c.code, 'VND');
                          
                          let formattedRate = rate.toFixed(isPerVND ? (rate < 0.0001 ? 6 : 4) : 0);
                          if (!isPerVND) {
                            formattedRate = new Intl.NumberFormat('vi-VN').format(rate);
                          }
                          
                          return (
                            <div key={c.code} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60 last:border-0 sm:[&:nth-last-child(-n+2)]:border-0">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                {!isPerVND && <span>{c.flag}</span>}
                                <span>{isPerVND ? '1 ₫' : `1 ${c.code}`}</span>
                              </span>
                              <span className="text-[13px] font-black text-blue-600 dark:text-cyan-400">
                                {formattedRate} {isPerVND ? c.code : '₫'}
                              </span>
                            </div>
                          );
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
                        id="theme-btn-light"
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
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.themeLight')}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Crystal Light</p>
                        </div>
                      </button>

                      {/* Dark */}
                      <button
                        type="button"
                        id="theme-btn-dark"
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
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.themeDark')}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Obsidian Glass</p>
                        </div>
                      </button>

                      {/* System */}
                      <button
                        type="button"
                        id="theme-btn-system"
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
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.themeSystem')}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('settings.themeAuto')}</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: GOOGLE CALENDAR / NOTIFICATIONS */}
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
                            <BellRing className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('settings.reimbursementNotifTitle')}
                              </h4>
                              {calendarConnected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> {t('settings.statusOn')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                                  {t('settings.statusOff')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {calendarConnected 
                                ? t('settings.notifPermissionGranted')
                                : t('settings.notifPermissionPrompt')}
                            </p>
                          </div>
                        </div>

                        {/* Single Master Toggle Switch (Turn ON / OFF) */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isConnectingCalendar && (
                            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                          )}
                          <label htmlFor="calendar-sync-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input
                              id="calendar-sync-toggle"
                              name="calendar-sync-toggle"
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
                              {t('settings.defaultLeadTimeTitle')}
                            </h5>
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                              {t('settings.afterDays', { count: settings.calendarReminderDays || 3 })}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { days: 3, label: t('settings.days3', { defaultValue: '3 ngày' }) },
                              { days: 5, label: t('settings.days5', { defaultValue: '5 ngày' }) },
                              { days: 7, label: t('settings.week1', { defaultValue: '1 tuần' }) },
                              { days: 14, label: t('settings.weeks2', { defaultValue: '2 tuần' }) },
                            ].map((opt) => {
                              const isSelected = (settings.calendarReminderDays || 3) === opt.days;
                              return (
                                <button
                                  key={opt.days}
                                  type="button"
                                  id={`reminder-days-btn-${opt.days}`}
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
                                {t('settings.syncPendingTitle')}
                              </h5>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                {expenses.filter(e => e.isReimbursable && !e.calendarEventId && !e.isResolved).length > 0
                                  ? t('settings.syncPendingCount', { count: expenses.filter(e => e.isReimbursable && !e.calendarEventId && !e.isResolved).length })
                                  : t('settings.syncAllScheduled')}
                              </p>
                            </div>

                            <button
                              type="button"
                              id="sync-all-reimbursements-btn"
                              disabled={isSyncingAll}
                              onClick={async () => {
                                try {
                                  setIsSyncingAll(true);
                                  const count = await onSyncExpensesCalendar();
                                  if (count > 0) {
                                    onShowNotification?.(t('settings.syncSuccess', { count }));
                                  } else {
                                    onShowNotification?.(t('settings.syncNone'));
                                  }
                                } catch (e: any) {
                                  onShowNotification?.(e?.message || t('settings.syncError'), 'error');
                                } finally {
                                  setIsSyncingAll(false);
                                }
                              }}
                              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <RefreshCw className={cn("w-3.5 h-3.5", isSyncingAll && "animate-spin")} />
                              <span>{isSyncingAll ? t('settings.syncing') : t('settings.syncNow')}</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                        {t('settings.notifDisabledExplainer')}
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
                  href="./about.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 underline transition-colors"
                >
                  {t('settings.footerAbout', { defaultValue: 'Giới thiệu' })}
                </a>
                <span>•</span>
                <a
                  href="./privacy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 underline transition-colors"
                >
                  {t('settings.footerPrivacy', { defaultValue: 'Chính sách bảo mật' })}
                </a>
                <span>•</span>
                <a
                  href="./terms.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 underline transition-colors"
                >
                  {t('settings.footerTerms', { defaultValue: 'Điều khoản' })}
                </a>
              </div>
              <button
                type="button"
                id="settings-done-btn"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              >
                {t('settings.done', { defaultValue: 'Hoàn tất' })}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
