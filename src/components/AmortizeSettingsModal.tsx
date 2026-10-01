import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { CurrencyCode } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Layers, 
  X, 
  Check, 
  Calendar, 
  Plus, 
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

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
  const { t } = useTranslation();

  const transactionMonth = useMemo(() => {
    return transactionDate ? transactionDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
  }, [transactionDate]);

  // Default months: 3 months prior (e.g. Month 9 -> 6, 7, 8 as in user example)
  const defaultMonths = useMemo(() => {
    return [
      shiftMonth(transactionMonth, -3),
      shiftMonth(transactionMonth, -2),
      shiftMonth(transactionMonth, -1),
    ];
  }, [transactionMonth]);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [customMonthInput, setCustomMonthInput] = useState<string>('');
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
      setErrorMsg(null);
    }
  }, [isOpen, initialMonths, defaultMonths, transactionMonth]);

  // Generate a list of candidate months to choose from (from 6 months ago up to 12 months ahead)
  const candidateMonths = useMemo(() => {
    const list: string[] = [];
    for (let i = -6; i <= 11; i++) {
      list.push(shiftMonth(transactionMonth, i));
    }
    // Also include any selected months that might be outside this range
    selectedMonths.forEach(m => {
      if (!list.includes(m)) {
        list.push(m);
      }
    });
    return list.sort();
  }, [transactionMonth, selectedMonths]);

  // Quick preset handlers
  const applyPreset = (months: string[]) => {
    setSelectedMonths([...months].sort());
    setErrorMsg(null);
  };

  const handleToggleMonth = (m: string) => {
    setErrorMsg(null);
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length === 1) {
        setErrorMsg('Cần chọn ít nhất 1 tháng để phân bổ.');
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
      setErrorMsg('Tháng này đã được chọn.');
      return;
    }
    setSelectedMonths(prev => [...prev, customMonthInput].sort());
    setErrorMsg(null);
  };

  const perMonthAmount = useMemo(() => {
    if (selectedMonths.length === 0) return 0;
    return (amount || 0) / selectedMonths.length;
  }, [amount, selectedMonths]);

  const handleSave = () => {
    if (selectedMonths.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 tháng.');
      return;
    }
    onConfirm([...selectedMonths].sort());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="liquid-glass-elevated rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-white/90 dark:border-white/15 shadow-2xl relative flex flex-col gap-5 overflow-hidden my-8"
        >
          {/* Top specular highlight */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95 pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 ring-2 ring-white/60 dark:ring-white/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black font-heading text-slate-900 dark:text-white tracking-tight">
                  Tuỳ chỉnh thanh toán gộp
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Phân bổ khoản chi đều cho các tháng trên biểu đồ thống kê
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info pill: Transaction info */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-medium">Khoản thanh toán: </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {formatCurrency(amount || 0, baseCurrency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Ngày trả: <strong>{transactionDate ? transactionDate.split('-').reverse().join('/') : 'Hôm nay'}</strong></span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Chọn nhanh theo chu kỳ:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset([
                  shiftMonth(transactionMonth, -3),
                  shiftMonth(transactionMonth, -2),
                  shiftMonth(transactionMonth, -1),
                ])}
                className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer shadow-2xs"
                title="3 tháng trước ngày thanh toán (Ví dụ đóng tiền nhà T9 cho 3 tháng 6, 7, 8)"
              >
                3 tháng trước (T{shiftMonth(transactionMonth, -3).split('-')[1]} - T{shiftMonth(transactionMonth, -1).split('-')[1]})
              </button>

              <button
                type="button"
                onClick={() => applyPreset([
                  shiftMonth(transactionMonth, -2),
                  shiftMonth(transactionMonth, -1),
                  transactionMonth,
                ])}
                className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer shadow-2xs"
              >
                3 tháng gần nhất (gồm T{transactionMonth.split('-')[1]})
              </button>

              <button
                type="button"
                onClick={() => applyPreset([
                  transactionMonth,
                  shiftMonth(transactionMonth, 1),
                  shiftMonth(transactionMonth, 2),
                ])}
                className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer shadow-2xs"
              >
                3 tháng tới
              </button>

              <button
                type="button"
                onClick={() => applyPreset([
                  shiftMonth(transactionMonth, -5),
                  shiftMonth(transactionMonth, -4),
                  shiftMonth(transactionMonth, -3),
                  shiftMonth(transactionMonth, -2),
                  shiftMonth(transactionMonth, -1),
                  transactionMonth,
                ])}
                className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer shadow-2xs"
              >
                6 tháng
              </button>

              <button
                type="button"
                onClick={() => {
                  const arr = [];
                  for (let i = 0; i < 12; i++) {
                    arr.push(shiftMonth(transactionMonth, i));
                  }
                  applyPreset(arr);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer shadow-2xs"
              >
                12 tháng (1 năm)
              </button>
            </div>
          </div>

          {/* Interactive Month Selection Grid */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chọn tháng muốn chia vào:
              </label>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                Đã chọn: {selectedMonths.length} tháng
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto p-2 rounded-2xl bg-white/50 dark:bg-slate-900/60 border border-white/80 dark:border-white/10 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
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
                      "px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-1 transition-all cursor-pointer border",
                      isSelected
                        ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20"
                        : "bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-slate-700/80"
                    )}
                  >
                    <div className="flex flex-col text-left leading-tight min-w-0">
                      <span>T{mn}/{y.slice(-2)}</span>
                      {isPayMonth && (
                        <span className={cn(
                          "text-[9px] font-medium leading-none mt-0.5",
                          isSelected ? "text-purple-200" : "text-amber-600 dark:text-amber-400"
                        )}>
                          (Tháng trả)
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Month Picker */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thêm tháng khác:</span>
              <input
                type="month"
                value={customMonthInput}
                onChange={(e) => setCustomMonthInput(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddCustomMonth}
                className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Allocation Calculation Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-300/40 dark:border-purple-800/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Mỗi tháng sẽ hiển thị trong biểu đồ:
              </span>
              <span className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300">
                {formatCurrency(perMonthAmount, baseCurrency)} / tháng
              </span>
            </div>

            {selectedMonths.length > 0 && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Chia đều cho: {selectedMonths.map(m => `T${m.split('-')[1]}/${m.split('-')[0]}`).join(', ')}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 px-1">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="liquid-glass-btn-primary px-5 py-2.5 rounded-2xl text-white text-xs font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận & Áp dụng</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
