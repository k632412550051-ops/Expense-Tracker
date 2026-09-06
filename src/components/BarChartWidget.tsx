import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Expense, CurrencyCode } from '../types';
import { formatCurrency } from '../lib/utils';
import { getExpenseConvertedAmount } from '../lib/exchangeRates';

interface BarChartWidgetProps {
  expenses: Expense[];
  currentMonthKey?: string;
  baseCurrency?: CurrencyCode;
}

export function BarChartWidget({ expenses, currentMonthKey, baseCurrency = 'VND' }: BarChartWidgetProps) {
  const { t, i18n } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [useRealTime, setUseRealTime] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const realTimeMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }, []);

  const data = useMemo(() => {
    const result = [];
    let currentYear: number;
    let currentMonthIdx: number;
    
    if (!useRealTime && currentMonthKey) {
      const [yearStr, monthStr] = currentMonthKey.split('-');
      currentYear = parseInt(yearStr, 10);
      currentMonthIdx = parseInt(monthStr, 10) - 1;
    } else {
      const d = new Date();
      currentYear = d.getFullYear();
      currentMonthIdx = d.getMonth();
    }
    
    const lang = i18n.language?.slice(0, 2);

    // Generate the last 6 months including current
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const monthNum = d.getMonth() + 1;
      const yearShort = d.getFullYear().toString().slice(-2);
      const monthStr = `${d.getFullYear()}-${monthNum.toString().padStart(2, '0')}`;
      
      let displayStr = `T${monthNum}/${yearShort}`;
      if (lang === 'en') {
        displayStr = `${monthNum}/${yearShort}`;
      } else if (lang === 'ja') {
        displayStr = `${monthNum}月`;
      } else if (lang === 'ko') {
        displayStr = `${monthNum}월`;
      } else if (lang === 'zh') {
        displayStr = `${monthNum}月`;
      }
      
      result.push({
        monthKey: monthStr,
        name: displayStr,
        total: 0,
        isCurrentMonth: monthStr === realTimeMonthKey,
        isSelectedMonth: monthStr === currentMonthKey
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
  }, [expenses, currentMonthKey, baseCurrency, i18n.language, useRealTime, realTimeMonthKey]);

  return (
    <div className="liquid-glass rounded-3xl p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col h-[400px] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              {t('charts.barTitle')}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {useRealTime ? t('charts.realtime', { defaultValue: 'Thời gian thực' }) : t('charts.bySelected', { defaultValue: 'Theo tháng chọn' })}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t('charts.barSubtitle')}
          </p>
        </div>

        {currentMonthKey && currentMonthKey !== realTimeMonthKey && (
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              id="barchart-toggle-realtime"
              onClick={() => setUseRealTime(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                useRealTime
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('charts.realtimeBtn', { defaultValue: 'Hiện tại' })}
            </button>
            <button
              type="button"
              id="barchart-toggle-selected"
              onClick={() => setUseRealTime(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !useRealTime
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {currentMonthKey}
            </button>
          </div>
        )}
      </div>

      <div className="w-full" style={{ minWidth: 0, height: 300 }}>
        {isMounted && (
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.25)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
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
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip 
                itemStyle={{ color: '#f8fafc' }} cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                formatter={(value: number) => [formatCurrency(value, baseCurrency), t('charts.totalSpent')]}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '4px' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  background: 'rgba(15, 23, 42, 0.92)', 
                  backdropFilter: 'blur(12px)', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
                  color: '#f8fafc',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' 
                }}
              />
              <Bar 
                dataKey="total" 
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`bar-cell-${index}`} 
                    fill={entry.isCurrentMonth || entry.isSelectedMonth ? 'url(#barGradientActive)' : 'url(#barGradient)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
