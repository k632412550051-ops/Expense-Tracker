import React, { useMemo } from 'react';
import { Expense, BudgetMap, Category, getCategoryColor } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { AlertTriangle, Edit2 } from 'lucide-react';

interface BudgetAlertsWidgetProps {
  expenses: Expense[];
  budgets: BudgetMap;
  categories: Category[];
  categoryColors?: Record<string, string>;
  onEditClick?: () => void;
}

export function BudgetAlertsWidget({ expenses, budgets, categories, categoryColors, onEditClick }: BudgetAlertsWidgetProps) {
  const spendingByCategory = useMemo(() => {
    const sums: Record<Category, number> = {};
    categories.forEach(c => sums[c] = 0);

    expenses.forEach(exp => {
      sums[exp.category] = (sums[exp.category] || 0) + exp.amount;
    });

    return sums;
  }, [expenses, categories]);

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-7 relative shadow-xl shadow-blue-950/5 border border-white/85 overflow-hidden">
      {/* Specular line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 tracking-tight">
          Hạn mức ngân sách
        </h2>
        {onEditClick && (
          <button 
            onClick={onEditClick}
            className="liquid-glass-pill text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-white/90 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa</span>
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-5">
        {categories.map(category => {
          const spent = spendingByCategory[category] || 0;
          const budget = budgets[category] || 0;
          const rawPercentage = budget > 0 ? (spent / budget) * 100 : 0;
          const percentage = Math.min(rawPercentage, 100);
          
          const isOverBudget = spent > budget;
          const isWarning = rawPercentage >= 80 && !isOverBudget;
          const catColor = getCategoryColor(category, 'expense', categoryColors);
          
          return (
            <div key={category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-xs" 
                    style={{ backgroundColor: catColor }}
                  />
                  <span className="font-bold text-xs sm:text-sm text-slate-800">{category}</span>
                  {isOverBudget && (
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Vượt hạn mức
                    </div>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  {formatCurrency(spent)} <span className="text-slate-400 font-normal">/ {formatCurrency(budget)}</span>
                </div>
              </div>
              
              <div className="h-2.5 w-full bg-slate-200/50 rounded-full overflow-hidden p-0.5 border border-white/60 shadow-inner">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out shadow-xs",
                    isOverBudget 
                      ? "bg-gradient-to-r from-rose-500 to-red-600" 
                      : isWarning 
                      ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                      : "bg-gradient-to-r from-blue-600 to-cyan-500"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
