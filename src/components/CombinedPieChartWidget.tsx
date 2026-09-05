import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Expense, getCategoryColor, CurrencyCode } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getExpenseConvertedAmount } from '../lib/exchangeRates';
import { PieChart as PieIcon } from 'lucide-react';

interface CombinedPieChartWidgetProps {
  currentMonthExpenses: Expense[];
  previousMonthExpenses: Expense[];
  currentMonthLabel: string;
  previousMonthLabel: string;
  categoryColors?: Record<string, string>;
  baseCurrency?: CurrencyCode;
}

export function CombinedPieChartWidget({
  currentMonthExpenses,
  previousMonthExpenses,
  currentMonthLabel,
  previousMonthLabel,
  categoryColors,
  baseCurrency = 'VND'
}: CombinedPieChartWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous'>('current');

  const activeExpenses = selectedPeriod === 'current' ? currentMonthExpenses : previousMonthExpenses;
  const activeLabel = selectedPeriod === 'current' ? currentMonthLabel : previousMonthLabel;

  const { data, totalAmount } = useMemo(() => {
    const sums: Record<string, number> = {};
    let total = 0;

    activeExpenses.forEach(exp => {
      const converted = getExpenseConvertedAmount(exp, baseCurrency);
      sums[exp.category] = (sums[exp.category] || 0) + converted;
      total += converted;
    });

    const chartData = Object.keys(sums).map((category) => ({
      name: category,
      value: sums[category],
      color: getCategoryColor(category, 'expense', categoryColors)
    })).filter(item => item.value > 0);

    // Sort descending by amount
    chartData.sort((a, b) => b.value - a.value);

    return { data: chartData, totalAmount: total };
  }, [activeExpenses, categoryColors, baseCurrency]);

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col min-h-[420px] overflow-hidden">
      {/* Top specular highlight */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />

      {/* Header with Title & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/20 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              Cơ cấu chi tiêu
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Tổng chi: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount, baseCurrency)}</span>
          </p>
        </div>

        {/* Tab switcher: Tháng này / Tháng trước */}
        <div className="flex items-center p-1 rounded-2xl bg-blue-950/5 dark:bg-slate-950/50 border border-white/70 dark:border-white/10 backdrop-blur-md self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedPeriod('current')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              selectedPeriod === 'current'
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Tháng {currentMonthLabel}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('previous')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              selectedPeriod === 'previous'
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            Tháng trước ({previousMonthLabel})
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">
          <p>Không có khoản chi nào trong Tháng {activeLabel}.</p>
        </div>
      ) : (
        <>
         <div className="flex-1 w-full relative min-h-[240px]" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={50}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="75%"
                  paddingAngle={3}
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, fill }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius * 1.2;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill={fill} 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central" 
                        fontSize="12px" 
                        fontWeight="700"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1, strokeOpacity: 0.6 }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value, baseCurrency), 'Đã chi']}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    background: 'rgba(15, 23, 42, 0.85)', 
                    backdropFilter: 'blur(12px)', 
                    border: '1px solid rgba(255, 255, 255, 0.15)', 
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' 
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-2 pt-3 border-t border-blue-100/40 dark:border-white/10">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-white/20 shadow-xs" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 font-bold text-xs truncate max-w-[130px]">
                  {entry.name}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                  ({((entry.value / totalAmount) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
