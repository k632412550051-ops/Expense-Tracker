import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Expense, CurrencyCode } from '../types';
import { formatCurrency } from '../lib/utils';
import { getExpenseConvertedAmount } from '../lib/exchangeRates';

interface BarChartWidgetProps {
  expenses: Expense[];
  currentMonthKey?: string;
  baseCurrency?: CurrencyCode;
}

export function BarChartWidget({ expenses, currentMonthKey, baseCurrency = 'VND' }: BarChartWidgetProps) {
  const data = useMemo(() => {
    const result = [];
    let currentYear, currentMonthIdx;
    
    if (currentMonthKey) {
      const [yearStr, monthStr] = currentMonthKey.split('-');
      currentYear = parseInt(yearStr, 10);
      currentMonthIdx = parseInt(monthStr, 10) - 1;
    } else {
      const d = new Date();
      currentYear = d.getFullYear();
      currentMonthIdx = d.getMonth();
    }
    
    // Generate the last 6 months including current
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const monthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const displayStr = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
      
      result.push({
        monthKey: monthStr,
        name: displayStr,
        total: 0
      });
    }

    expenses.forEach(exp => {
      if (exp.type === 'income') return; // only chart expenses
      const monthKey = exp.date.slice(0, 7); // 'YYYY-MM'
      const monthData = result.find(r => r.monthKey === monthKey);
      if (monthData) {
        monthData.total += getExpenseConvertedAmount(exp, baseCurrency);
      }
    });

    return result;
  }, [expenses, currentMonthKey, baseCurrency]);

  return (
    <div className="liquid-glass rounded-3xl p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col h-[400px] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />
      <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white mb-1 tracking-tight">Chi tiêu 6 tháng gần nhất</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">Xu hướng biến động chi tiêu theo thời gian</p>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
              dy={10}
            />
            <YAxis 
              tickFormatter={(value) => {
                if (baseCurrency === 'VND') {
                  return value >= 1000000 
                    ? `${(value / 1000000).toFixed(1).replace('.0', '')}tr` 
                    : `${(value / 1000).toFixed(0)}k`;
                }
                return value >= 1000 
                  ? `${(value / 1000).toFixed(1).replace('.0', '')}k` 
                  : `${value}`;
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
              formatter={(value: number) => [formatCurrency(value, baseCurrency), 'Tổng chi']}
              labelStyle={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ color: '#f8fafc' }}
              contentStyle={{ 
                borderRadius: '16px', 
                background: 'rgba(15, 23, 42, 0.85)', 
                backdropFilter: 'blur(12px)', 
                border: '1px solid rgba(255, 255, 255, 0.15)', 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' 
              }}
            />
            <Bar dataKey="total" fill="url(#barGradient)" radius={[8, 8, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
