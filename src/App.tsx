import React, { useMemo, useState, useEffect } from 'react';
import { useFirebaseData } from './hooks/useFirebaseData';
import { loginWithGoogle, logout } from './lib/firebase';
import { Expense, AppSettings, DEFAULT_SETTINGS } from './types';
import { ExpenseForm } from './components/ExpenseForm';
import { CombinedPieChartWidget } from './components/CombinedPieChartWidget';
import { BarChartWidget } from './components/BarChartWidget';
import { BudgetAlertsWidget } from './components/BudgetAlertsWidget';
import { BudgetSettingsModal } from './components/BudgetSettingsModal';
import { SettingsModal } from './components/SettingsModal';
import { TransactionHistory } from './components/TransactionHistory';
import { 
  Wallet, 
  Target, 
  Receipt, 
  BarChart3, 
  LogOut, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Settings as SettingsIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency, setGlobalCurrency, setGlobalPrivacyMode } from './lib/utils';

export default function App() {
  const { 
    user, 
    loading, 
    categories, 
    incomeCategories, 
    categoryColors, 
    budgets, 
    expenses, 
    addExpense, 
    deleteExpense, 
    updateExpense, 
    updateUserSettings, 
    updateExpensesCategory 
  } = useFirebaseData();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // App Settings (Currency, Theme, Privacy Mode)
  const [settings, setSettings] = useState<AppSettings>(() => {
    let initial = DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem('expense_tracker_settings');
      if (saved) {
        initial = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to parse settings:", e);
    }
    setGlobalCurrency(initial.currency);
    setGlobalPrivacyMode(initial.privacyMode);
    return initial;
  });

  // Sync settings with localStorage & dark mode
  useEffect(() => {
    setGlobalCurrency(settings.currency);
    setGlobalPrivacyMode(settings.privacyMode);
    try {
      localStorage.setItem('expense_tracker_settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && mediaQuery.matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    applyTheme();

    if (settings.theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [settings]);

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    // 1. Immediately & synchronously update module globals BEFORE state commit
    if (partial.currency !== undefined) {
      setGlobalCurrency(partial.currency);
    }
    if (partial.privacyMode !== undefined) {
      setGlobalPrivacyMode(partial.privacyMode);
    }

    // 2. Update React state immediately
    setSettings(prev => {
      const next = { ...prev, ...partial };
      setGlobalCurrency(next.currency);
      setGlobalPrivacyMode(next.privacyMode);
      try {
        localStorage.setItem('expense_tracker_settings', JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save settings:", e);
      }
      return next;
    });

    // 3. Inform user instantly
    if (partial.privacyMode !== undefined) {
      showNotification(
        partial.privacyMode ? 'Đã ẩn số dư (Chế độ riêng tư)' : 'Đã hiển thị số dư'
      );
    } else {
      showNotification('Đã cập nhật cài đặt');
    }
  };
  
  const getLocalMonthString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 7);
  };

  // Track currently viewed month (defaults to current date)
  const [currentMonth, setCurrentMonth] = useState(getLocalMonthString()); // Format: YYYY-MM
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setAuthError(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err?.code === 'auth/unauthorized-domain') {
        setAuthError(`Tên miền "${window.location.hostname}" chưa được cấp phép trong Firebase Console. Vui lòng vào Firebase Console > Authentication > Settings > Authorized Domains để thêm tên miền này.`);
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('Trình duyệt đã chặn pop-up đăng nhập. Vui lòng cho phép mở pop-up và thử lại.');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 3000);
  };
  
  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    try {
      await addExpense(newExpense);
      showNotification('Đã thêm giao dịch thành công!');
    } catch (error) {
      showNotification('Có lỗi xảy ra khi lưu giao dịch.', 'error');
    }
  };

  const executeRemoveExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      showNotification('Đã xóa giao dịch thành công!');
    } catch (error: any) {
      console.error("Delete expense error: ", error);
      showNotification(`Có lỗi xảy ra: ${error?.message || 'Không rõ nguyên nhân'}`, 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleRemoveExpense = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleToggleResolved = async (expense: Expense) => {
    try {
      await updateExpense(expense.id, { isResolved: !expense.isResolved });
      if (!expense.isResolved) {
         showNotification('Đã đánh dấu hoàn tiền thành công!');
      } else {
         showNotification('Đã bỏ đánh dấu hoàn tiền!');
      }
    } catch (error) {
      showNotification('Có lỗi xảy ra khi cập nhật.', 'error');
    }
  };
  
  const currentMonthTransactions = useMemo(() => {
    return expenses.filter(exp => exp.date.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const currentMonthExpensesList = useMemo(() => {
    return currentMonthTransactions.filter(exp => 
      (exp.type === 'expense' || !exp.type) && !exp.isResolved
    );
  }, [currentMonthTransactions]);

  const currentMonthIncomeList = useMemo(() => {
    return currentMonthTransactions.filter(exp => exp.type === 'income');
  }, [currentMonthTransactions]);

  const previousMonth = useMemo(() => {
    const [yearStr, monthStr] = currentMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return `${year}-${month.toString().padStart(2, '0')}`;
  }, [currentMonth]);

  const previousMonthTransactions = useMemo(() => {
    return expenses.filter(exp => exp.date.startsWith(previousMonth));
  }, [expenses, previousMonth]);

  const previousMonthExpensesList = useMemo(() => {
    return previousMonthTransactions.filter(exp => 
      (exp.type === 'expense' || !exp.type) && !exp.isResolved
    );
  }, [previousMonthTransactions]);

  const totalSpent = useMemo(() => {
    return currentMonthExpensesList.reduce((sum, exp) => sum + exp.amount, 0);
  }, [currentMonthExpensesList]);

  const totalReimbursable = useMemo(() => {
    return currentMonthExpensesList.filter(exp => exp.isReimbursable).reduce((sum, exp) => sum + exp.amount, 0);
  }, [currentMonthExpensesList]);

  const totalIncome = useMemo(() => {
    return currentMonthIncomeList.reduce((sum, exp) => sum + exp.amount, 0);
  }, [currentMonthIncomeList]);

  const balance = totalIncome - totalSpent;
  
  const totalBudget = useMemo(() => {
    // Only sum budgets for currently active categories
    return categories.reduce((sum, cat) => sum + (budgets[cat] || 0), 0);
  }, [budgets, categories]);

  if (loading) {
     return (
        <div className="min-h-screen liquid-glass-canvas flex flex-col items-center justify-center p-4">
            <div className="liquid-glass-elevated rounded-2xl px-6 py-4 flex items-center gap-3 border border-white/80 shadow-xl">
              <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <div className="text-slate-700 font-bold text-sm">Đang tải dữ liệu...</div>
            </div>
        </div>
     );
  }

  if (!user) {
      return (
          <div className="min-h-screen liquid-glass-canvas flex items-center justify-center p-4 relative overflow-hidden">
              {/* Background ambient orbs */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/25 via-sky-300/20 to-transparent blur-3xl pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-cyan-400/20 via-blue-600/15 to-transparent blur-3xl pointer-events-none" />

              <div className="liquid-glass-elevated p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full border border-white relative flex flex-col items-center justify-center text-center overflow-hidden">
                  {/* Top specular highlight */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95 pointer-events-none" />

                  {/* 3D Glass Emblem */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 p-0.5 shadow-xl shadow-blue-500/30 flex items-center justify-center mb-6 relative group">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white/30 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/40">
                      <Wallet className="w-9 h-9 text-white drop-shadow-md" />
                    </div>
                  </div>

                  <h1 className="text-3xl font-black font-heading text-slate-900 mb-2 tracking-tight">Expense Tracker</h1>
                  <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">
                    Hệ thống quản lý tài chính thông minh, bảo mật & trực quan với phong cách Liquid Glass 3D.
                  </p>
                  
                  {authError && (
                    <div className="w-full mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-300 text-rose-800 text-xs text-left leading-relaxed">
                      <p className="font-bold mb-1">Lỗi đăng nhập:</p>
                      <p>{authError}</p>
                    </div>
                  )}

                  <button 
                     onClick={handleGoogleLogin}
                     disabled={isLoggingIn}
                     className="w-full liquid-glass-pill hover:bg-white text-slate-800 py-3.5 px-6 rounded-2xl font-bold shadow-md shadow-blue-900/5 hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer border border-white/90 group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                      {isLoggingIn ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                      )}
                      <span>{isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập với Google'}</span>
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen liquid-glass-canvas font-sans text-slate-900 dark:text-slate-100 pb-20 relative overflow-x-hidden selection:bg-blue-600 selection:text-white dark:bg-[#090e1a] transition-colors duration-300">
      {/* Dynamic ambient luminous backdrops with vivid liquid glass refraction */}
      <div className="fixed top-[-80px] right-[-80px] w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] rounded-full bg-gradient-to-br from-blue-400/25 via-sky-300/20 to-transparent dark:from-blue-600/40 dark:via-cyan-400/25 dark:to-transparent blur-[100px] pointer-events-none -z-10" />
      <div className="fixed top-[40%] left-[-120px] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-gradient-to-tr from-cyan-400/20 via-blue-500/15 to-transparent dark:from-indigo-500/35 dark:via-blue-600/25 dark:to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-60px] right-[15%] w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] rounded-full bg-indigo-500/15 dark:bg-sky-500/25 blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="liquid-glass sticky top-0 z-30 border-b border-white/80 dark:border-white/15 shadow-md shadow-blue-950/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Crystal 3D Logo Badge */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-0.5 shadow-md shadow-blue-600/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-white/30 to-transparent backdrop-blur-sm flex items-center justify-center border border-white/40">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-xs" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black font-heading tracking-tight text-slate-900 dark:text-white">
                Expense Tracker
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Privacy Mode Quick Toggle */}
            <button
              onClick={() => handleUpdateSettings({ privacyMode: !settings.privacyMode })}
              className={`liquid-glass-pill text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all cursor-pointer shadow-2xs hover:bg-white/90 dark:hover:bg-slate-800/90 ${
                settings.privacyMode
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
              title={settings.privacyMode ? "Đang ẩn số dư — Bấm để hiện" : "Bấm để ẩn số dư (Chế độ riêng tư)"}
            >
              {settings.privacyMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Ẩn số dư</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hiện số dư</span>
                </>
              )}
            </button>

            {/* Fintech Settings Trigger */}
            <button
              id="settings-trigger-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="liquid-glass-pill text-xs font-bold flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all cursor-pointer shadow-2xs hover:bg-white/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-white/90 dark:border-white/10 group"
              title="Mở Cài đặt (Tài khoản, Tiền tệ, Giao diện)"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-white dark:ring-slate-700" 
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </div>
              )}
              <span className="hidden md:inline font-semibold text-slate-700 dark:text-slate-300">
                {settings.currency}
              </span>
              <SettingsIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 group-hover:rotate-45 transition-all" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Month Selector Capsule */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight">
            Tổng quan tháng {currentMonth.split('-')[1]}/{currentMonth.split('-')[0]}
          </h2>
          <div className="flex items-center gap-1.5 liquid-glass p-1 rounded-2xl border border-white/90 dark:border-white/15 shadow-2xs self-start sm:self-auto">
            <button
              onClick={() => {
                let [y, m] = currentMonth.split('-').map(Number);
                m -= 1;
                if (m < 1) { m = 12; y -= 1; }
                setCurrentMonth(`${y}-${m.toString().padStart(2, '0')}`);
              }}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <input 
                id="month-selector"
                type="month" 
                value={currentMonth} 
                onChange={(e) => setCurrentMonth(e.target.value)} 
                className="px-2 py-1 bg-white/80 dark:bg-slate-900/80 border border-white/90 dark:border-white/15 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 dark:text-white transition-all cursor-pointer shadow-2xs"
              />
            </div>
            <button
              onClick={() => {
                let [y, m] = currentMonth.split('-').map(Number);
                m += 1;
                if (m > 12) { m = 1; y += 1; }
                setCurrentMonth(`${y}-${m.toString().padStart(2, '0')}`);
              }}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Summary Cards (4 Liquid Glass Cards) - 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 mb-8">
          {/* Card 1: Balance */}
          <div className="liquid-glass liquid-glass-interactive liquid-crystal-sheen rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/15 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />
             <div className="flex items-center justify-between mb-2 sm:mb-3">
               <div className="flex items-center gap-1.5">
                 <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Số dư</span>
                 <button
                   onClick={() => handleUpdateSettings({ privacyMode: !settings.privacyMode })}
                   className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
                   title={settings.privacyMode ? "Hiện số dư" : "Ẩn số dư"}
                 >
                   {settings.privacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
                 </button>
               </div>
               <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-600">
                 <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               </div>
             </div>
             <div>
               <p className={`text-lg sm:text-2xl md:text-3xl font-black font-heading tracking-tight ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {formatCurrency(balance, settings.currency, settings.privacyMode)}
               </p>
               <p className="text-[10px] sm:text-[11px] font-semibold mt-0.5 truncate text-slate-400">
                 {balance >= 0 ? 'Thặng dư' : 'Thâm hụt'}
               </p>
             </div>
          </div>

          {/* Card 2: Total Income */}
          <div className="liquid-glass liquid-glass-interactive liquid-crystal-sheen rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/15 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng thu</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl md:text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(totalIncome, settings.currency, settings.privacyMode)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate">
                +{currentMonthIncomeList.length} khoản
              </p>
            </div>
          </div>

          {/* Card 3: Total Expense */}
          <div className="liquid-glass liquid-glass-interactive liquid-crystal-sheen rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/15 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng chi</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl md:text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(totalSpent, settings.currency, settings.privacyMode)}
              </p>
              {totalReimbursable > 0 ? (
                <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 truncate">
                  Chờ hoàn {formatCurrency(totalReimbursable, settings.currency, settings.privacyMode)}
                </p>
              ) : (
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5 truncate">
                  {currentMonthExpensesList.length} khoản
                </p>
              )}
            </div>
          </div>
          
          {/* Card 4: Budget */}
          <div className="liquid-glass liquid-glass-interactive liquid-crystal-sheen rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/15 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hạn mức</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl md:text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white">
                {formatCurrency(totalBudget, settings.currency, settings.privacyMode)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5 truncate">
                {totalBudget > 0 ? `Đã dùng ${((totalSpent / totalBudget) * 100).toFixed(0)}%` : 'Chưa đặt'}
              </p>
            </div>
          </div>
        </div>

        {/* Form and Budget Progress Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          <ExpenseForm 
            onAddExpense={handleAddExpense} 
            categories={categories} 
            incomeCategories={incomeCategories} 
            recentTransactions={expenses} 
          />
          <BudgetAlertsWidget 
            expenses={currentMonthExpensesList} 
            budgets={budgets} 
            categories={categories}
            categoryColors={categoryColors}
            onEditClick={() => setIsBudgetModalOpen(true)} 
          />
        </div>

        {/* Transaction History with Google Calendar View / List Toggle */}
        <div className="mb-10">
          <TransactionHistory 
            expenses={expenses}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            categories={categories}
            incomeCategories={incomeCategories}
            categoryColors={categoryColors}
            onToggleResolved={handleToggleResolved}
            onDeleteExpense={handleRemoveExpense}
          />
        </div>

        {/* Visual Analytics Section */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight">
              Phân tích chi tiêu
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CombinedPieChartWidget 
              currentMonthExpenses={currentMonthExpensesList}
              previousMonthExpenses={previousMonthExpensesList}
              currentMonthLabel={currentMonth.split('-')[1]}
              previousMonthLabel={previousMonth.split('-')[1]}
              categoryColors={categoryColors}
            />
            <BarChartWidget 
               currentMonthKey={currentMonth}
               expenses={expenses.filter(e => 
                 (e.type === 'expense' || !e.type) && !e.isResolved
               )} 
            />
          </div>
        </section>

      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        user={user}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        onLogout={logout}
      />

      {isBudgetModalOpen && (
        <BudgetSettingsModal
          budgets={budgets}
          categories={categories}
          incomeCategories={incomeCategories}
          categoryColors={categoryColors}
          onSave={async (newBudgets, newCategories, renames, newIncomeCategories, incomeRenames, newCategoryColors) => {
            try {
              await updateUserSettings(newBudgets, newCategories, newIncomeCategories, newCategoryColors);
              const allRenames = [...renames, ...incomeRenames];
              if (allRenames && allRenames.length > 0) {
                 await updateExpensesCategory(allRenames);
              }
              setIsBudgetModalOpen(false);
              showNotification('Cập nhật thiết lập thành công!');
            } catch (error: any) {
              console.error("Save settings error: ", error);
              showNotification(`Có lỗi xảy ra: ${error?.message || 'Không rõ nguyên nhân'}`, 'error');
            }
          }}
          onClose={() => setIsBudgetModalOpen(false)}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="liquid-glass-elevated rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-white relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />
            <h3 className="text-lg font-extrabold font-heading text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 font-medium leading-relaxed">
              Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => executeRemoveExpense(deleteConfirmId)}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 rounded-xl transition-all shadow-md shadow-rose-500/25 cursor-pointer"
              >
                Xóa giao dịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-xl ${notification.type === 'success' ? 'bg-white/90 border-emerald-200/80 text-emerald-900 shadow-emerald-500/10' : 'bg-white/90 border-rose-200/80 text-rose-900 shadow-rose-500/10'} transition-all z-50 animate-in slide-in-from-bottom-3 duration-300`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-500 shadow-xs shadow-emerald-400' : 'bg-rose-500 shadow-xs shadow-rose-400'}`}></span>
            <p className="font-bold text-xs sm:text-sm">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
