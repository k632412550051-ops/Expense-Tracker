import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CurrencyCode } from '../types';
import { formatCurrency, cn, shiftMonth, formatMonthRange } from '../lib/utils';
import { Layers, X, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface AmortizeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  baseCurrency: CurrencyCode;
  transactionDate: string; // YYYY-MM-DD
  initialMonths?: string[]; // YYYY-MM[]
  onConfirm: (months: string[]) => void;
}

// Generate all YYYY-MM months between start and end inclusive
function getMonthsBetween(start: string, end: string): string[] {
  if (!start || !end) return [];
  let [startY, startM] = start.split('-').map(Number);
  let [endY, endM] = end.split('-').map(Number);

  if (startY > endY || (startY === endY && startM > endM)) {
    [startY, endY] = [endY, startY];
    [startM, endM] = [endM, startM];
  }

  const result: string[] = [];
  let curY = startY;
  let curM = startM;

  while (curY < endY || (curY === endY && curM <= endM)) {
    result.push(`${curY}-${curM.toString().padStart(2, '0')}`);
    curM++;
    if (curM > 12) {
      curM = 1;
      curY++;
    }
  }
  return result;
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
  const [viewYear, setViewYear] = useState<number>(() => parseInt(transactionMonth.split('-')[0], 10));
  const [rangeStart, setRangeStart] = useState<string>(transactionMonth);
  const [rangeEnd, setRangeEnd] = useState<string>(shiftMonth(transactionMonth, 2));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const init = initialMonths && initialMonths.length > 0 ? [...initialMonths].sort() : [...defaultMonths].sort();
      setSelectedMonths(init);
      setRangeStart(init[0] || transactionMonth);
      setRangeEnd(init[init.length - 1] || shiftMonth(transactionMonth, 2));
      const year = parseInt((init[0] || transactionMonth).split('-')[0], 10);
      setViewYear(year);
      setErrorMsg(null);
    }
  }, [isOpen, initialMonths, defaultMonths, transactionMonth]);

  const applyPreset = (monthCount: 3 | 6 | 12) => {
    const arr: string[] = [];
    for (let i = 0; i < monthCount; i++) {
      arr.push(shiftMonth(transactionMonth, i));
    }
    setSelectedMonths(arr);
    setRangeStart(arr[0]);
    setRangeEnd(arr[arr.length - 1]);
    setViewYear(parseInt(transactionMonth.split('-')[0], 10));
    setErrorMsg(null);
  };

  const handleRangeApply = (newStart: string, newEnd: string) => {
    if (!newStart || !newEnd) return;
    const months = getMonthsBetween(newStart, newEnd);
    if (months.length === 0) return;
    setSelectedMonths(months);
    setErrorMsg(null);
  };

  const handleToggleMonth = (monthKey: string) => {
    setErrorMsg(null);
    if (selectedMonths.includes(monthKey)) {
      if (selectedMonths.length === 1) {
        setErrorMsg('Cần chọn ít nhất 1 tháng');
        return;
      }
      const updated = selectedMonths.filter(m => m !== monthKey);
      setSelectedMonths(updated);
      if (updated.length > 0) {
        setRangeStart(updated[0]);
        setRangeEnd(updated[updated.length - 1]);
      }
    } else {
      const updated = [...selectedMonths, monthKey].sort();
      setSelectedMonths(updated);
      setRangeStart(updated[0]);
      setRangeEnd(updated[updated.length - 1]);
    }
  };

  const handleToggleEntireYear = () => {
    const yearMonths: string[] = [];
    for (let m = 1; m <= 12; m++) {
      yearMonths.push(`${viewYear}-${m.toString().padStart(2, '0')}`);
    }
    const allSelectedInYear = yearMonths.every(m => selectedMonths.includes(m));

    if (allSelectedInYear) {
      // Remove this year's months (ensure at least 1 month remains)
      const remaining = selectedMonths.filter(m => !m.startsWith(`${viewYear}-`));
      if (remaining.length === 0) {
        setErrorMsg('Cần chọn ít nhất 1 tháng');
        return;
      }
      setSelectedMonths(remaining);
      setRangeStart(remaining[0]);
      setRangeEnd(remaining[remaining.length - 1]);
    } else {
      // Add all 12 months of this year
      const set = new Set([...selectedMonths, ...yearMonths]);
      const updated = Array.from(set).sort();
      setSelectedMonths(updated);
      setRangeStart(updated[0]);
      setRangeEnd(updated[updated.length - 1]);
    }
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

  // Count how many months are selected in viewYear
  const selectedCountInViewYear = useMemo(() => {
    return selectedMonths.filter(m => m.startsWith(`${viewYear}-`)).length;
  }, [selectedMonths, viewYear]);

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
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  Tùy chỉnh phân bổ tháng
                </h3>
              </div>
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

          {/* Range Picker (From month → To month) - Scales to any year easily */}
          <div className="p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
              <span>Khoảng thời gian phân bổ:</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-semibold">Từ tháng</span>
                <input
                  type="month"
                  value={rangeStart}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRangeStart(val);
                    if (val && rangeEnd) handleRangeApply(val, rangeEnd);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                />
              </div>
              <span className="text-slate-400 font-bold self-end pb-2">→</span>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-semibold">Đến tháng</span>
                <input
                  type="month"
                  value={rangeEnd}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRangeEnd(val);
                    if (rangeStart && val) handleRangeApply(rangeStart, val);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Interactive Year Navigator & 12-Month Grid (Fixed compact size, never overflows) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {/* Year Stepper */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewYear(prev => prev - 1)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Năm trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
                  Năm {viewYear}
                </span>
                <button
                  type="button"
                  onClick={() => setViewYear(prev => prev + 1)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Năm sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Year summary & Toggle all */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-400">
                  {selectedCountInViewYear}/12 tháng
                </span>
                <button
                  type="button"
                  onClick={handleToggleEntireYear}
                  className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  {selectedCountInViewYear === 12 ? 'Bỏ chọn năm' : 'Chọn cả năm'}
                </button>
              </div>
            </div>

            {/* 12 Months Grid: 6 cols x 2 rows, clean and tight */}
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
              {Array.from({ length: 12 }, (_, i) => {
                const mNum = i + 1;
                const mPad = mNum.toString().padStart(2, '0');
                const mKey = `${viewYear}-${mPad}`;
                const isSelected = selectedMonths.includes(mKey);

                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => handleToggleMonth(mKey)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center relative",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-xs ring-1 ring-blue-500/30"
                        : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50"
                    )}
                  >
                    <span>T{mNum}</span>
                    {isSelected && (
                      <span className="absolute top-0.5 right-1 text-[8px] leading-none text-white/90">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Summary Card */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-slate-900/80 border border-blue-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px]">
                Phân bổ đều ({selectedMonths.length} tháng):
              </span>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {formatMonthRange(selectedMonths)}
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
