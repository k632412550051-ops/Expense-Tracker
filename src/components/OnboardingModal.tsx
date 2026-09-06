import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  Sparkles,
  Layers,
  BellRing,
  Languages,
  X,
  ArrowRight
} from 'lucide-react';
import { 
  CurrencyCode, 
  CURRENCY_OPTIONS, 
  PersonaType, 
  LanguageCode, 
  SUPPORTED_LANGUAGES 
} from '../types';
import { PERSONA_CONFIGS } from '../lib/persona';
import { changeAppLanguage } from '../i18n';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: (data: {
    displayName: string;
    persona: PersonaType;
    baseCurrency: CurrencyCode;
    frequentCurrencies: CurrencyCode[];
    monthlyBudget: number;
    enableNotifications: boolean;
    language: LanguageCode;
  }) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoggingIn: boolean;
  isLoggedIn?: boolean;
  authError?: string | null;
  initialName?: string;
  initialBaseCurrency?: CurrencyCode;
}

const PERSONA_LIST: {
  id: PersonaType;
  icon: React.ElementType;
}[] = [
  { id: 'student', icon: GraduationCap },
  { id: 'worker', icon: Briefcase },
  { id: 'nomad', icon: Plane },
  { id: 'family', icon: Home },
];

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
  onGoogleSignIn,
  isLoggingIn,
  isLoggedIn = false,
  authError,
  initialName = '',
  initialBaseCurrency = 'VND'
}: OnboardingModalProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // User input states
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(
    (i18n.language?.slice(0, 2) as LanguageCode) || 'vi'
  );
  const [displayName, setDisplayName] = useState(initialName);
  const [persona, setPersona] = useState<PersonaType>('student');
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(initialBaseCurrency);
  const [frequentCurrencies, setFrequentCurrencies] = useState<CurrencyCode[]>(['VND', 'USD']);
  const [enableNotifications, setEnableNotifications] = useState(true);

  if (!isOpen) return null;

  const handleLanguageChange = async (lang: LanguageCode) => {
    setSelectedLang(lang);
    await changeAppLanguage(lang);
  };

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

  const handleCompleteOnboarding = async () => {
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
      monthlyBudget: targetBudget,
      enableNotifications,
      language: selectedLang
    });
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
      monthlyBudget: targetBudget,
      enableNotifications,
      language: selectedLang
    });

    if (!isLoggedIn) {
      await onGoogleSignIn();
    }
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
        <div className="mb-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xs uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                {t('nav.appName')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t('onboarding.step')} {step}/4
              </span>
              {onClose && (
                <button
                  type="button"
                  id="close-onboarding-modal-btn"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title={t('common.close', { defaultValue: 'Đóng' })}
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
            {/* STEP 1: NGÔN NGỮ & TÊN */}
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
                    {t('onboarding.step1Title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {t('onboarding.step1Subtitle')}
                  </p>
                </div>

                {/* Language Selection Grid */}
                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                      {t('onboarding.selectLanguage')}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                      {SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.flag} {SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.nativeName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = selectedLang === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          id={`onboarding-lang-${lang.code}`}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-sm">{lang.flag}</span>
                            <span className="truncate">{lang.nativeName}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name input */}
                <div className="space-y-1.5">
                  <label htmlFor="onboarding-display-name" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    {t('onboarding.yourName')}
                  </label>
                  <input
                    id="onboarding-display-name"
                    name="onboarding-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canProceedStep1) {
                        setStep(2);
                      }
                    }}
                    placeholder={t('onboarding.yourNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner text-base"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: PERSONA */}
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
                    {t('onboarding.step2Title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {t('onboarding.step2Subtitle')}
                  </p>
                </div>

                {/* Persona selector grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  {PERSONA_LIST.map((item) => {
                    const Icon = item.icon;
                    const isSelected = persona === item.id;
                    const title = t(`personas.${item.id}.title`, { defaultValue: PERSONA_CONFIGS[item.id]?.title });
                    const tagline = t(`personas.${item.id}.tagline`, { defaultValue: PERSONA_CONFIGS[item.id]?.tagline });

                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`persona-btn-${item.id}`}
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
                            {title}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {tagline}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Personalization Explainer Card */}
                {PERSONA_CONFIGS[persona] && (
                  <motion.div 
                    key={persona}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/70 dark:from-slate-900/90 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-3.5 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-900/40 pb-2">
                      <div className="flex items-center gap-1.5 text-blue-900 dark:text-cyan-300 font-extrabold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                        <span>{t(`personas.${persona}.title`)}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/10 text-blue-700 dark:text-cyan-300 shrink-0 self-start sm:self-auto">
                        {t('stats.monthlyBudget')}: {baseCurrency === 'VND' 
                          ? `${PERSONA_CONFIGS[persona].recommendedMonthlyBudgetVND.toLocaleString()} ₫` 
                          : `${PERSONA_CONFIGS[persona].recommendedMonthlyBudgetUSD.toLocaleString()} ${baseCurrency}`}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {PERSONA_CONFIGS[persona].description}
                    </p>

                    {/* Auto-configured categories */}
                    <div className="pt-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        <Layers className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{t('budget.tabExpense')} ({PERSONA_CONFIGS[persona].defaultCategories.length}):</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {PERSONA_CONFIGS[persona].defaultCategories.map(c => t(`categories.${c}`, { defaultValue: c })).join(', ')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 3: TIỀN TỆ & NGÂN SÁCH */}
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
                    {t('onboarding.step3Title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {t('onboarding.step3Subtitle')}
                  </p>
                </div>

                {/* Base currency selection */}
                <div>
                  <h4 className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    {t('onboarding.baseCurrency')}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {CURRENCY_OPTIONS.slice(0, 6).map((curr) => {
                      const isSelected = baseCurrency === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          id={`base-curr-${curr.code}`}
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
                  <h4 className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    {t('onboarding.frequentCurrencies')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {CURRENCY_OPTIONS.map((curr) => {
                      const isBase = curr.code === baseCurrency;
                      const isPicked = isBase || frequentCurrencies.includes(curr.code);
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          id={`freq-curr-${curr.code}`}
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
                    {t('onboarding.step4Title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {t('onboarding.step4Subtitle')}
                  </p>
                </div>

                {/* Minimalist Profile Pill */}
                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {displayName || 'User'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t(`personas.${persona}.title`)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('settings.baseCurrencyTitle')}</span>
                    <span className="text-xs font-black text-blue-600 dark:text-cyan-400">
                      {CURRENCY_OPTIONS.find(c => c.code === baseCurrency)?.flag} {baseCurrency}
                    </span>
                  </div>
                </div>

                {/* Notification Toggle */}
                <div 
                  id="onboarding-toggle-notifications"
                  className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-slate-900/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between cursor-pointer" 
                  onClick={() => setEnableNotifications(!enableNotifications)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${enableNotifications ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {t('onboarding.notifReimbursement')}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                        {t('onboarding.notifReimbursementDesc')}
                      </div>
                    </div>
                  </div>
                  <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${enableNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enableNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-300 text-rose-800 dark:text-rose-300 text-xs leading-relaxed">
                    {authError}
                  </div>
                )}

                {/* Sign in or Complete Action */}
                {isLoggedIn ? (
                  <button
                    type="button"
                    id="onboarding-complete-btn"
                    onClick={handleCompleteOnboarding}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-5 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    <span>{t('common.done', { defaultValue: 'Hoàn tất & Bắt đầu trải nghiệm' })}</span>
                  </button>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      id="onboarding-google-signin-btn"
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
                      <span>{isLoggingIn ? t('auth.signingIn') : t('auth.signInWithGoogle')}</span>
                    </button>

                    
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              id="onboarding-back-btn"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              id="onboarding-continue-btn"
              disabled={step === 1 && !canProceedStep1}
              onClick={() => setStep((prev) => (prev + 1) as any)}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.continue')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
