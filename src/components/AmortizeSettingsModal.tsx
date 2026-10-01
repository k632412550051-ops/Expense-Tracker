import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyCode } from '../types';
import { formatCurrency, cn } from '../lib/utils';
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

// Helper to shift a 'YYYY-MM' by offset months
function shiftMonth(monthStr: string, offset: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1 + offset, 1);
  const newY = date.getFullYear();
  const newM = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${newY}-${newM}`;
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

  // Compact list of candidate months: from previous month up to 12 months ahead
  const candidateMonths = useMemo(() => {
    const set = new Set<string>();
    for (let i = -1; i <= 11; i++) {
      set.add(shiftMonth(transactionMonth, i));
    }
    // Also include any selected months outside this range
    selectedMonths.forEach(m => set.add(m));
    return Array.from(set).sort();
  }, [transactionMonth, selectedMonths]);

  const applyPreset = (months: string[]) => {
    setSelectedMonths([...months].sort());
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
          className="liquid-glass-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full border border-white/90 dark:border-white/15 shadow-2xl relative flex flex-col gap-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Thanh toán gộp
                  </h3>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/50">
                    {formatCurrency(amount || 0, baseCurrency)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets - 3 requested options: 3 tháng tới, 6 tháng tới, 1 năm tới */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-0.5">
              Chọn nhanh:
            </span>
            <button
              type="button"
              onClick={() => applyPreset([
                transactionMonth,
                shiftMonth(transactionMonth, 1),
                shiftMonth(transactionMonth, 2),
              ])}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border shadow-2xs",
                selectedMonths.length === 3 && selectedMonths[0] === transactionMonth
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              )}
            >
              3 tháng tới
            </button>
            <button
              type="button"
              onClick={() => {
                const arr = [];
                for (let i = 0; i < 6; i++) arr.push(shiftMonth(transactionMonth, i));
                applyPreset(arr);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border shadow-2xs",
                selectedMonths.length === 6 && selectedMonths[0] === transactionMonth
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              )}
            >
              6 tháng tới
            </button>
            <button
              type="button"
              onClick={() => {
                const arr = [];
                for (let i = 0; i < 12; i++) arr.push(shiftMonth(transactionMonth, i));
                applyPreset(arr);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border shadow-2xs",
                selectedMonths.length === 12 && selectedMonths[0] === transactionMonth
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              )}
            >
              1 năm tới
            </button>
          </div>

          {/* Month Chips Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Tháng phân bổ (bấm để bật/tắt):
              </span>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Khác</span>
              </button>
            </div>

            {/* Candidate Months Compact Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {candidateMonths.map(m => {
                const isSelected = selectedMonths.includes(m);
                const isPayMonth = m === transactionMonth;
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
                        : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-blue-400"
                    )}
                  >
                    <span>T{mn}/{y.slice(-2)}</span>
                    {isSelected ? (
                      <Check className="w-3 h-3 text-white shrink-0" />
                    ) : isPayMonth ? (
                      <span className="text-[9px] text-amber-500 font-bold shrink-0">•</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Custom Month Inline Input */}
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

          {/* Allocation Result - Clean Minimal 1-line Card */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-900/80 border border-blue-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 dark:text-white truncate">
                {selectedMonths.length} tháng ({selectedMonths.map(m => `T${m.split('-')[1]}`).join(', ')})
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Hiển thị trong biểu đồ thống kê
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
          <div className="flex items-center justify-end gap-2 pt-1">
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
              <span>Áp dụng</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
