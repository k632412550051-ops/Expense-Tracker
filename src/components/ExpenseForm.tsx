import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Expense, CurrencyCode, CURRENCY_OPTIONS, PersonaType } from '../types';
import { PlusCircle, Check, Calendar as CalendarIcon, BellRing, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { calculateReminderDate } from '../lib/googleCalendar';
import { PERSONA_CONFIGS } from '../lib/persona';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  categories: Category[];
  incomeCategories?: Category[];
  recentTransactions?: Expense[];
  baseCurrency?: CurrencyCode;
  userPersona?: PersonaType;
}

export function ExpenseForm({ 
  onAddExpense, 
  categories, 
  incomeCategories = [], 
  recentTransactions = [],
  baseCurrency = 'VND',
  userPersona,
}: ExpenseFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');

  const currentCategories = type === 'income' && incomeCategories?.length > 0 ? incomeCategories : categories;
  const [category, setCategory] = useState<Category>(currentCategories[0] || '');
  const getLocalDateString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  };

  const [date, setDate] = useState<string>(getLocalDateString());
  const [isReimbursable, setIsReimbursable] = useState<boolean>(false);
  const [reminderDate, setReminderDate] = useState<string>(() => calculateReminderDate(getLocalDateString(), 3));
  const [note, setNote] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // When transaction date changes, automatically suggest reminder date +3 days
  useEffect(() => {
    setReminderDate(calculateReminderDate(date, 3));
  }, [date]);

  // Extract recent unique notes for quick input
  const allUniqueNotes = useMemo(() => {
    const notes = recentTransactions
      .filter(t => t.type === type && t.note && t.note.trim() !== '')
      .map(t => t.note.trim());
    return Array.from(new Set(notes));
  }, [recentTransactions, type]);

  const filteredNotes = useMemo(() => {
    if (!note) return [];
    return allUniqueNotes
      .filter(n => n.toLowerCase().includes(note.toLowerCase()) && n !== note)
      .slice(0, 5);
  }, [allUniqueNotes, note]);

  // Persona quick suggestion pills
  const personaSuggestions = useMemo(() => {
    if (!userPersona || !PERSONA_CONFIGS[userPersona]) return [];
    return PERSONA_CONFIGS[userPersona].quickNoteSuggestions || [];
  }, [userPersona]);

  // Update default selected category if categories list changes
  useEffect(() => {
    if (currentCategories.length > 0 && !currentCategories.includes(category)) {
      setCategory(currentCategories[0]);
    }
  }, [currentCategories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const numAmount = Number(amount);

    try {
      await onAddExpense({
        amount: numAmount,
        currency: baseCurrency,
        convertedAmount: numAmount,
        category,
        date,
        note,
        type,
        isReimbursable: type === 'expense' ? isReimbursable : false,
        reimbursementReminderDate: (type === 'expense' && isReimbursable) ? reminderDate : undefined,
      });

      setAmount('');
      setNote('');
      setIsReimbursable(false);
      setReminderDate(calculateReminderDate(date, 3));
    } catch (error) {
      console.error(error);
    }
  };

  const currencySymbol = CURRENCY_OPTIONS.find(c => c.code === baseCurrency)?.symbol || (baseCurrency === 'VND' ? '₫' : '$');

  return (
    <motion.form 
      layout
      onSubmit={handleSubmit} 
      className="liquid-glass rounded-3xl p-6 sm:p-7 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/15 flex flex-col gap-4 overflow-hidden"
    >
      {/* Top Specular Line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-white/60 dark:ring-white/20">
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
            Thêm giao dịch
          </h2>
        </div>

        {/* Sliding Pill between Chi tiêu and Thu nhập */}
        <div className="flex p-1 rounded-2xl bg-blue-950/5 dark:bg-slate-900/60 border border-white/70 dark:border-white/15 backdrop-blur-md relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              "relative px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer z-10",
              type === 'expense'
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {type === 'expense' && (
              <motion.div
                layoutId="expenseFormTypePill"
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md shadow-rose-500/10 border border-white/80 dark:border-white/15 -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            Chi tiêu
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={cn(
              "relative px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer z-10",
              type === 'income'
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {type === 'income' && (
              <motion.div
                layoutId="expenseFormTypePill"
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md shadow-emerald-500/10 border border-white/80 dark:border-white/15 -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            Thu nhập
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Amount Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">
              Số tiền ({baseCurrency})
            </label>
          </div>

          <div className="relative">
            <input
              type="number"
              required
              min="0"
              step={baseCurrency === 'VND' || baseCurrency === 'JPY' || baseCurrency === 'KRW' ? "1" : "0.01"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/70 border border-white/80 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-inner shadow-blue-900/5 text-sm font-semibold pr-10"
              placeholder={`0 ${currencySymbol}`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 dark:text-slate-300 pointer-events-none">
              {currencySymbol}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">Danh mục</label>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div 
              key={type}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-white/80 dark:border-white/15 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm font-medium cursor-pointer"
              >
                {currentCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{cat}</option>
                ))}
              </select>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">Ngày</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/70 border border-white/80 dark:border-white/15 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm font-medium shadow-inner shadow-blue-900/5"
          />
        </div>

        <div className="flex flex-col gap-1.5 relative">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">Ghi chú</label>
          <input
            type="text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/70 border border-white/80 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm shadow-inner shadow-blue-900/5"
            placeholder="Ví dụ: Cà phê sáng, ăn trưa, vé máy bay"
          />
          {showSuggestions && filteredNotes.length > 0 && (
            <div className="absolute top-full mt-1.5 w-full liquid-glass-elevated border border-white/90 dark:border-white/15 rounded-2xl shadow-xl z-20 max-h-40 overflow-y-auto p-1">
              {filteredNotes.map((n, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setNote(n);
                    setShowSuggestions(false);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50/80 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-cyan-400 rounded-xl cursor-pointer transition-colors"
                >
                  {n}
                </div>
              ))}
            </div>
          )}

          {/* Persona-driven quick note suggestion chips */}
          {personaSuggestions.length > 0 && !note && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                Gợi ý nhanh:
              </span>
              {personaSuggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNote(s)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200/70 dark:border-slate-700/80 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {type === 'expense' && (
          <motion.div
            key="reimbursable-checkbox-container"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 mt-0.5 px-1 overflow-hidden"
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="isReimbursable"
                checked={isReimbursable}
                onChange={(e) => setIsReimbursable(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isReimbursable" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none flex items-center gap-1.5">
                <span>Chi ứng trước (cần đòi / hoàn lại)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-bold border border-blue-200/50 dark:border-blue-900/50">
                  Google Calendar
                </span>
              </label>
            </div>

            {isReimbursable && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-blue-50/50 dark:bg-slate-900/50 border border-blue-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <span className="font-medium">Ngày hẹn hoàn tiền:</span>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-cyan-300 font-medium">
                  <BellRing className="w-3.5 h-3.5 shrink-0" />
                  <span>Tự động đồng bộ lên Google Calendar</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layout
        whileTap={{ scale: 0.98 }}
        type="submit"
        className="liquid-glass-btn-primary liquid-crystal-sheen mt-2 flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-2xl transition-all cursor-pointer"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Lưu giao dịch</span>
      </motion.button>
    </motion.form>
  );
}
