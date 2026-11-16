import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Expense, Category, CurrencyCode } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getExpenseConvertedAmount } from '../lib/exchangeRates';
import { useCategoryTranslation } from '../lib/useCategoryTranslation';
import { BarChart2, TrendingDown, TrendingUp } from 'lucide-react';

interface CategoryComparisonBarWidgetProps {
  expenses: Expense[];
  currentMonthKey: string; // YYYY-MM
  previousMonthKey: string; // YYYY-MM
  categories: Category[];
  baseCurrency?: CurrencyCode;
}

interface ComparisonRow {
  rawCategory: string;
  name: string;
  current: number;
  previous: number;
  diff: number;
  diffPercent: number | null;
}

function getDaysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function formatDayRangeLabel(monthKey: string, cutoffDay: number): string {
  const monthNum = parseInt(monthKey.split('-')[1], 10);
  const padDay = cutoffDay.toString().padStart(2, '0');
  if (cutoffDay <= 1) {
    return `01/${monthNum}`;
  }
  return `01–${padDay}/${monthNum}`;
}

export function CategoryComparisonBarWidget({
  expenses,
  currentMonthKey,
  previousMonthKey,
  categories,
  baseCurrency = 'VND',
}: CategoryComparisonBarWidgetProps) {
  const { t } = useTranslation();
  const { translateCategory } = useCategoryTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    data,
    currentRangeLabel,
    previousRangeLabel,
    currentPeriodTotal,
    previousPeriodTotal,
    totalDiffPercent,
  } = useMemo(() => {
    const todayDay = new Date().getDate();
    const curDays = getDaysInMonth(currentMonthKey);
    const prevDays = getDaysInMonth(previousMonthKey);

    const curCutoff = Math.min(todayDay, curDays);
    const prevCutoff = Math.min(curCutoff, prevDays);

    const curSums: Record<string, number> = {};
    const prevSums: Record<string, number> = {};
    const allCats = new Set<string>(categories);

    let curTotal = 0;
    let prevTotal = 0;

    expenses.forEach((exp) => {
      if (exp.type === 'income' || exp.isResolved) return;

      const converted = getExpenseConvertedAmount(exp, baseCurrency);
      const expMonth = exp.date.slice(0, 7);
      const expDay = parseInt(exp.date.slice(8, 10), 10) || 1;
      allCats.add(exp.category);

      if (exp.isAmortized && exp.amortizedMonths && exp.amortizedMonths.length > 0) {
        const split = converted / exp.amortizedMonths.length;

        if (exp.amortizedMonths.includes(currentMonthKey)) {
          const includeCur = expMonth === currentMonthKey ? expDay <= curCutoff : true;
          if (includeCur) {
            curSums[exp.category] = (curSums[exp.category] || 0) + split;
            curTotal += split;
          }
        }

        if (exp.amortizedMonths.includes(previousMonthKey)) {
          const includePrev = expMonth === previousMonthKey ? expDay <= prevCutoff : true;
          if (includePrev) {
            prevSums[exp.category] = (prevSums[exp.category] || 0) + split;
            prevTotal += split;
          }
        }
      } else {
        if (expMonth === currentMonthKey && expDay <= curCutoff) {
          curSums[exp.category] = (curSums[exp.category] || 0) + converted;
          curTotal += converted;
        } else if (expMonth === previousMonthKey && expDay <= prevCutoff) {
          prevSums[exp.category] = (prevSums[exp.category] || 0) + converted;
          prevTotal += converted;
        }
      }
    });

    const rows: ComparisonRow[] = [];
    allCats.forEach((cat) => {
      const curVal = curSums[cat] || 0;
      const prevVal = prevSums[cat] || 0;
      if (curVal <= 0 && prevVal <= 0) return;

      const diff = curVal - prevVal;
      const diffPercent = prevVal > 0 ? (diff / prevVal) * 100 : null;
      rows.push({
        rawCategory: cat,
        name: translateCategory(cat),
        current: curVal,
        previous: prevVal,
        diff,
        diffPercent,
      });
    });

    rows.sort((a, b) => Math.max(b.current, b.previous) - Math.max(a.current, a.previous));

    const overallDiffPct =
      prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : null;

    return {
      data: rows,
      currentRangeLabel: formatDayRangeLabel(currentMonthKey, curCutoff),
      previousRangeLabel: formatDayRangeLabel(previousMonthKey, prevCutoff),
      currentPeriodTotal: curTotal,
      previousPeriodTotal: prevTotal,
      totalDiffPercent: overallDiffPct,
    };
  }, [expenses, currentMonthKey, previousMonthKey, categories, baseCurrency, translateCategory]);

  const formatShortTick = (value: number) => {
    if (baseCurrency === 'VND') {
      if (value === 0) return '0';
      return value >= 1000000
        ? `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}tr`
        : `${(value / 1000).toFixed(0)}k`;
    }
    if (value === 0) return '0';
    return value >= 1000
      ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
      : `${value}`;
  };

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const row: ComparisonRow = payload[0]?.payload;
    if (!row) return null;

    const isIncrease = row.diff > 0;
    const isDecrease = row.diff < 0;

    return (
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 px-3.5 py-2.5 shadow-xl text-xs text-slate-100 min-w-[200px]">
        <p className="font-extrabold text-white mb-2">{row.name}</p>
        <div className="flex flex-col gap-1.5 tabular-nums">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 shrink-0" />
              {currentRangeLabel}
            </span>
            <span className="font-bold text-white">
              {formatCurrency(row.current, baseCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 shrink-0" />
              {previousRangeLabel}
            </span>
            <span className="font-semibold text-slate-300">
              {formatCurrency(row.previous, baseCurrency)}
            </span>
          </div>
          <div className="pt-1.5 mt-0.5 border-t border-white/10 flex items-center justify-between gap-4">
            <span className="text-slate-400">{t('charts.mtdDifference', { defaultValue: 'Chênh lệch' })}</span>
            <span
              className={cn(
                'font-bold',
                isIncrease
                  ? 'text-rose-400'
                  : isDecrease
                  ? 'text-emerald-400'
                  : 'text-slate-300'
              )}
            >
              {isIncrease ? '+' : ''}
              {formatCurrency(row.diff, baseCurrency)}
              {row.diffPercent !== null && (
                <span className="ml-1 opacity-90">
                  ({isIncrease ? '+' : ''}
                  {row.diffPercent.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/20 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              {t('charts.mtdTitle', { defaultValue: 'So sánh chi tiêu cùng kỳ theo danh mục' })}
            </h2>
          </div>

          {/* Unboxed concise metadata line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 tabular-nums">
            <span>
              {currentRangeLabel}:{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                {formatCurrency(currentPeriodTotal, baseCurrency)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {previousRangeLabel}:{' '}
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                {formatCurrency(previousPeriodTotal, baseCurrency)}
              </strong>
            </span>
            {totalDiffPercent !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-bold',
                    totalDiffPercent > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : totalDiffPercent < 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {totalDiffPercent > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  ) : totalDiffPercent < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                  ) : null}
                  <span>
                    {totalDiffPercent > 0 ? '+' : ''}
                    {totalDiffPercent.toFixed(1)}%
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Clean inline legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 tabular-nums">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded-xs bg-gradient-to-b from-blue-500 to-blue-700 shrink-0" />
            <span>{t('charts.mtdCurrentPeriod', { range: currentRangeLabel, defaultValue: `Kỳ này (${currentRangeLabel})` })}</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-3 h-3 rounded-xs bg-slate-400/80 dark:bg-slate-500 shrink-0" />
            <span>{t('charts.mtdPreviousPeriod', { range: previousRangeLabel, defaultValue: `Kỳ trước (${previousRangeLabel})` })}</span>
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart or Empty State */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium text-center">
          <p>
            {t('charts.mtdNoData', {
              currentRange: currentRangeLabel,
              previousRange: previousRangeLabel,
              defaultValue: `Chưa có khoản chi nào trong khoảng ${currentRangeLabel} hoặc ${previousRangeLabel}.`,
            })}
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ minWidth: 0, height: 310 }}>
          {isMounted && (
            <ResponsiveContainer width="100%" height={310} minWidth={0}>
              <BarChart
                data={data}
                margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                barGap={6}
                barCategoryGap="24%"
              >
                <defs>
                  <linearGradient id="mtdCurrentBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(148, 163, 184, 0.25)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(val: string) =>
                    val.length > 16 ? `${val.slice(0, 15)}…` : val
                  }
                  dy={8}
                />
                <YAxis
                  tickFormatter={formatShortTick}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                  content={renderTooltip}
                />
                <Bar
                  dataKey="current"
                  name={currentRangeLabel}
                  fill="url(#mtdCurrentBarGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="previous"
                  name={previousRangeLabel}
                  fill="#94a3b8"
                  fillOpacity={0.75}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
