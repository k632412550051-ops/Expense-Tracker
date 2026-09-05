import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  GraduationCap, 
  Briefcase, 
  Plane, 
  Home, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Coins,
  Globe2,
  X
} from 'lucide-react';
import { CurrencyCode, CURRENCY_OPTIONS, PersonaType } from '../types';
import { PERSONA_CONFIGS } from '../lib/persona';
import { formatCurrency } from '../lib/utils';
import { 
  Sparkles,
  Layers,
  Zap,
  Lightbulb
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: (data: {
    displayName: string;
    persona: PersonaType;
    baseCurrency: CurrencyCode;
    frequentCurrencies: CurrencyCode[];
    monthlyBudget: number;
  }) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoggingIn: boolean;
  authError?: string | null;
  initialName?: string;
  initialBaseCurrency?: CurrencyCode;
}

const PERSONA_LIST: {
  id: PersonaType;
  title: string;
  icon: React.ElementType;
}[] = [
  { id: 'student', title: 'Du học sinh', icon: GraduationCap },
  { id: 'worker', title: 'Người đi làm', icon: Briefcase },
  { id: 'nomad', title: 'Du lịch / Nomad', icon: Plane },
  { id: 'family', title: 'Cá nhân & Gia đình', icon: Home },
];

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
  onGoogleSignIn,
  isLoggingIn,
  authError,
  initialName = '',
  initialBaseCurrency = 'VND'
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User input states
  const [displayName, setDisplayName] = useState(initialName);
  const [persona, setPersona] = useState<PersonaType>('student');
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(initialBaseCurrency);
  const [frequentCurrencies, setFrequentCurrencies] = useState<CurrencyCode[]>(['VND', 'USD']);

  if (!isOpen) return null;

  const toggleFrequentCurrency = (code: CurrencyCode) => {
    if (code === baseCurrency) return;
    if (frequentCurrencies.includes(code)) {
      setFrequentCurrencies(prev => prev.filter(c => c !== code));
    } else {
      setFrequentCurrencies(prev => [...prev, code]);
    }
  };

  const handleBaseCurrencyChange = (newBase: CurrencyCode) => {
    setBaseCurrency(newBase);
    if (!frequentCurrencies.includes(newBase)) {
      setFrequentCurrencies(prev => [newBase, ...prev]);
    }
  };

  const handleFinishAndSignIn = async () => {
    const finalName = displayName.trim() || 'Bạn';
    const pConfig = PERSONA_CONFIGS[persona] || PERSONA_CONFIGS.student;
    const targetBudget = baseCurrency === 'VND' 
      ? pConfig.recommendedMonthlyBudgetVND 
      : pConfig.recommendedMonthlyBudgetUSD;

    await onComplete({
      displayName: finalName,
      persona,
      baseCurrency,
      frequentCurrencies: Array.from(new Set([baseCurrency, ...frequentCurrencies])),
      monthlyBudget: targetBudget
    });
    await onGoogleSignIn();
  };

  const canProceedStep1 = displayName.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="liquid-glass-elevated rounded-3xl max-w-lg w-full max-h-[92vh] p-5 sm:p-7 border border-white dark:border-white/15 shadow-2xl relative flex flex-col my-auto overflow-hidden"
      >
        {/* Top specular highlight */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

        {/* Header & Step progress */}
        <div className="mb-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xs uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                Thiết lập ban đầu
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Bước {step}/4
              </span>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-600 dark:bg-cyan-400"
              initial={false}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: HỎI TÊN */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight mb-1">
                    Bạn tên là gì?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Nhập tên hoặc biệt danh để ứng dụng hiển thị lời chào.
                  </p>
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canProceedStep1) {
                        setStep(2);
                      }
                    }}
                    placeholder="VD: Minh, Thuỳ Linh, Alex..."
                    className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner text-base"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: PERSONA (CÁ NHÂN HÓA RÕ RÀNG) */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-3.5"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight mb-1">
                    Bạn là ai?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Chọn vai trò để ứng dụng tự động thiết lập danh mục chi tiêu, ngân sách & gợi ý phù hợp nhất cho bạn.
                  </p>
                </div>

                {/* Persona selector grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  {PERSONA_LIST.map((item) => {
                    const Icon = item.icon;
                    const isSelected = persona === item.id;
                    const config = PERSONA_CONFIGS[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPersona(item.id)}
                        className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {config?.focusAreas.slice(0, 2).join(' • ')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dedicated Personalization Explainer Card */}
                {PERSONA_CONFIGS[persona] && (
                  <motion.div 
                    key={persona}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/70 dark:from-slate-900/90 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-blue-100 dark:border-blue-900/40 pb-2">
                      <div className="flex items-center gap-1.5 text-blue-900 dark:text-cyan-300 font-extrabold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                        <span>App sẽ tự động cá nhân hóa những gì?</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-700 dark:text-cyan-300 shrink-0">
                        Ngân sách gợi ý: {PERSONA_CONFIGS[persona].recommendedMonthlyBudgetVND.toLocaleString('vi-VN')} ₫/tháng
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {PERSONA_CONFIGS[persona].description}
                    </p>

                    {/* Auto-configured categories */}
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        <Layers className="w-3 h-3 text-blue-500" />
                        <span>Bộ 6 danh mục được tạo sẵn:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {PERSONA_CONFIGS[persona].defaultCategories.map((cat) => (
                          <span 
                            key={cat}
                            className="px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick input notes */}
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Gợi ý ghi chú nhanh 1 chạm khi nhập chi:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {PERSONA_CONFIGS[persona].quickNoteSuggestions.map((q) => (
                          <span 
                            key={q}
                            className="px-1.5 py-0.5 rounded-md bg-blue-100/60 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 text-[10px] font-medium"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Advice snippet */}
                    <div className="flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="italic">{PERSONA_CONFIGS[persona].financialAdvice}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 3: CHỌN TIỀN CƠ SỞ & NGOẠI TỆ HAY DÙNG */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight mb-1">
                    Đơn vị tiền tệ
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Báo cáo tổng quan sẽ tính theo đồng tiền cơ sở (mặc định VND).
                  </p>
                </div>

                {/* Base currency selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    Đồng tiền cơ sở
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CURRENCY_OPTIONS.slice(0, 6).map((curr) => {
                      const isSelected = baseCurrency === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => handleBaseCurrencyChange(curr.code)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <span className="text-lg">{curr.flag}</span>
                          <span className="font-extrabold text-xs">{curr.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Frequent currencies */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    Ngoại tệ hay dùng (chọn thêm nếu có)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CURRENCY_OPTIONS.map((curr) => {
                      const isBase = curr.code === baseCurrency;
                      const isPicked = isBase || frequentCurrencies.includes(curr.code);
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          disabled={isBase}
                          onClick={() => toggleFrequentCurrency(curr.code)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                            isBase
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-cyan-400 opacity-80 cursor-default'
                              : isPicked
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                              : 'bg-white/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}
                        >
                          <span>{curr.flag}</span>
                          <span>{curr.code}</span>
                          {isPicked && !isBase && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SIGN IN WITH GOOGLE */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight mb-1">
                    Sẵn sàng bắt đầu!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Đăng nhập Google để lưu trữ an toàn hồ sơ của bạn.
                  </p>
                </div>

                {/* Minimalist Profile Pill */}
                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {displayName || 'Bạn'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {PERSONA_LIST.find(p => p.id === persona)?.title}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tiền cơ sở</span>
                    <span className="text-xs font-black text-blue-600 dark:text-cyan-400">
                      {CURRENCY_OPTIONS.find(c => c.code === baseCurrency)?.flag} {baseCurrency}
                    </span>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-300 text-rose-800 dark:text-rose-300 text-xs leading-relaxed">
                    {authError}
                  </div>
                )}

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleFinishAndSignIn}
                  disabled={isLoggingIn}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 py-3.5 px-5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer border border-slate-200 dark:border-white/15 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  <span>{isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập với Google'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !canProceedStep1}
              onClick={() => setStep((prev) => (prev + 1) as any)}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp tục
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
