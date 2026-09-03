import React, { useState, useEffect, useMemo } from 'react';
import { Category, Expense } from '../types';
import { PlusCircle } from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  categories: Category[];
  incomeCategories?: Category[];
  recentTransactions?: Expense[];
}

export function ExpenseForm({ onAddExpense, categories, incomeCategories = [], recentTransactions = [] }: ExpenseFormProps) {
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
  const [note, setNote] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

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

  // Update default selected category if categories list changes
  useEffect(() => {
    if (currentCategories.length > 0 && !currentCategories.includes(category)) {
      setCategory(currentCategories[0]);
    }
  }, [currentCategories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    try {
      await onAddExpense({
        amount: Number(amount),
        category,
        date,
        note,
        type,
        isReimbursable: type === 'expense' ? isReimbursable : false,
      });

      setAmount('');
      setNote('');
      setIsReimbursable(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="liquid-glass rounded-3xl p-6 sm:p-7 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/15 flex flex-col gap-4 overflow-hidden">
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

        <div className="flex p-1 rounded-2xl bg-blue-950/5 dark:bg-slate-900/60 border border-white/70 dark:border-white/15 backdrop-blur-md self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              type === 'expense'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/15'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chi tiêu
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              type === 'income'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/15'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Thu nhập
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">Số tiền</label>
          <input
            type="number"
            required
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-900/70 border border-white/80 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-inner shadow-blue-900/5 text-sm font-semibold"
            placeholder="0 đ"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide">Danh mục</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-white/80 dark:border-white/15 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm font-medium cursor-pointer"
          >
            {currentCategories.map(cat => (
              <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{cat}</option>
            ))}
          </select>
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
            placeholder="Ví dụ: Cà phê sáng, ăn trưa"
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
        </div>
      </div>

      {type === 'expense' && (
        <div className="flex items-center gap-2.5 mt-0.5 px-1">
          <input
            type="checkbox"
            id="isReimbursable"
            checked={isReimbursable}
            onChange={(e) => setIsReimbursable(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="isReimbursable" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            Chi ứng trước (cần đòi / hoàn lại)
          </label>
        </div>
      )}

      <button
        type="submit"
        className="liquid-glass-btn-primary liquid-crystal-sheen mt-2 flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-2xl transition-all cursor-pointer"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Lưu giao dịch</span>
      </button>
    </form>
  );
}
