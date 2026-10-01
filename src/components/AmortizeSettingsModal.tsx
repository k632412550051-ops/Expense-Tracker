import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyCode } from '../types';
import { formatCurrency, cn, shiftMonth, formatMonthRange } from '../lib/utils';
import { Layers, X, Check, Plus } from 'lucide-react';

interface AmortizeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  baseCurrency: CurrencyCode;
  transactionDate: string; // YYYY-MM-DD
  initialMonths?: string[]; // YYYY-MM[]
  onConfirm: (months: string[]) => void;
}

export function AmortizeSettingsModal({
  isOpen,
  onClose,
  amount,
  baseCurrency,
  transactionDate,
  initialMonths,
  onConfirm,
}: AmortizeSettingsModalProps) {
  const transactionMonth = useMemo(() => {
    return transactionDate ? transactionDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
  }, [transactionDate]);

  // Default months: 3 months forward (3 tháng tới)
  const defaultMonths = useMemo(() => {
    return [
      transactionMonth,
      shiftMonth(transactionMonth, 1),
      shiftMonth(transactionMonth, 2),
    ];
  }, [transactionMonth]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [customMonthInput, setCustomMonthInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialMonths && initialMonths.length > 0) {
        setSelectedMonths([...initialMonths].sort());
      } else {
        setSelectedMonths([...defaultMonths].sort());
      }
      setCustomMonthInput(transactionMonth);
      setShowCustomInput(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialMonths, defaultMonths, transactionMonth]);

  // Candidate months: current month + next 11 months (total 12 months)
  const candidateMonths = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < 12; i++) {
      set.add(shiftMonth(transactionMonth, i));
    }
    selectedMonths.forEach(m => set.add(m));
    return Array.from(set).sort();
  }, [transactionMonth, selectedMonths]);

  const applyPreset = (monthCount: 3 | 6 | 12) => {
    const arr: string[] = [];
    for (let i = 0; i < monthCount; i++) {
      arr.push(shiftMonth(transactionMonth, i));
    }
    setSelectedMonths(arr);
    setErrorMsg(null);
  };

  const handleToggleMonth = (m: string) => {
    setErrorMsg(null);
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length === 1) {
        setErrorMsg('Cần chọn ít nhất 1 tháng');
        return;
      }
      setSelectedMonths(prev => prev.filter(item => item !== m));
    } else {
      setSelectedMonths(prev => [...prev, m].sort());
    }
  };

  const handleAddCustomMonth = () => {
    if (!customMonthInput) return;
    if (selectedMonths.includes(customMonthInput)) {
      setErrorMsg('Tháng này đã được chọn');
      return;
    }
    setSelectedMonths(prev => [...prev, customMonthInput].sort());
    setShowCustomInput(false);
    setErrorMsg(null);
  };

  const perMonthAmount = useMemo(() => {
    if (selectedMonths.length === 0) return 0;
    return (amount || 0) / selectedMonths.length;
  }, [amount, selectedMonths]);

  const isPresetActive = (count: number) => {
    if (selectedMonths.length !== count) return false;
    const sorted = [...selectedMonths].sort();
    if (sorted[0] !== transactionMonth) return false;
    return sorted.every((m, idx) => m === shiftMonth(transactionMonth, idx));
  };

  const handleSave = () => {
    if (selectedMonths.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 tháng');
      return;
    }
    onConfirm([...selectedMonths].sort());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="liquid-glass-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full border border-white/90 dark:border-white/15 shadow-2xl relative flex flex-col gap-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                Tùy chỉnh phân bổ tháng
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets: 3 tháng tới, 6 tháng tới, 1 năm tới */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
              Chọn nhanh:
            </span>
            <button
              type="button"
              onClick={() => applyPreset(3)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs",
                isPresetActive(3)
                  ? "bg-blue-600 text-white border-blue-500 shadow-xs ring-1 ring-blue-500/30"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              )}
            >
              3 tháng tới
            </button>
            <button
              type="button"
              onClick={() => applyPreset(6)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs",
                isPresetActive(6)
                  ? "bg-blue-600 text-white border-blue-500 shadow-xs ring-1 ring-blue-500/30"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              )}
            >
              6 tháng tới
            </button>
            <button
              type="button"
              onClick={() => applyPreset(12)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs",
                isPresetActive(12)
                  ? "bg-blue-600 text-white border-blue-500 shadow-xs ring-1 ring-blue-500/30"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
              )}
            >
              1 năm tới
            </button>
          </div>

          {/* Month Chips Grid */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Tháng áp dụng ({selectedMonths.length}):
              </span>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Tháng khác</span>
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
              {candidateMonths.map(m => {
                const isSelected = selectedMonths.includes(m);
                const [y, mn] = m.split('-');

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleToggleMonth(m)}
                    className={cn(
                      "px-2 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                        : "bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                    )}
                  >
                    <span>T{mn}/{y.slice(-2)}</span>
                    {isSelected && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {showCustomInput && (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="month"
                  value={customMonthInput}
                  onChange={(e) => setCustomMonthInput(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomMonth}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            )}
          </div>

          {/* Clean Summary Card */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-900/80 border border-blue-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px]">
                Phân bổ đều:
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {selectedMonths.length} tháng ({formatMonthRange(selectedMonths)})
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-extrabold text-blue-700 dark:text-cyan-400">
                {formatCurrency(perMonthAmount, baseCurrency)}
              </span>
              <span className="text-[10px] text-slate-400 block font-normal">/tháng</span>
            </div>
          </div>

          {errorMsg && (
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Xác nhận</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
