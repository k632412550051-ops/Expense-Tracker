import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Expense, Category, CurrencyCode } from '../types';
import { formatCurrency, formatCompactCurrency, getGlobalPrivacyMode, cn } from '../lib/utils';
import { getExpenseConvertedAmount } from '../lib/exchangeRates';
import { useCategoryTranslation } from '../lib/useCategoryTranslation';
import { BarChart2, TrendingDown, TrendingUp, Minus } from 'lucide-react';

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

interface TotalComparisonRow {
  key: 'current' | 'prevSamePeriod' | 'prevFullMonth';
  name: string;
  amount: number;
  subLabel: string;
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
  const [viewMode, setViewMode] = useState<'total' | 'category'>('total');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentMonthNum = parseInt(currentMonthKey.split('-')[1], 10);
  const prevMonthNum = parseInt(previousMonthKey.split('-')[1], 10);

  const {
    categoryData,
    totalBarData,
    cutoffDay,
    currentRangeLabel,
    previousRangeLabel,
    currentPeriodTotal,
    previousPeriodTotal,
    previousFullMonthTotal,
    totalDiff,
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
    let prevFullTotal = 0;

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
          prevFullTotal += split;
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
        } else if (expMonth === previousMonthKey) {
          prevFullTotal += converted;
          if (expDay <= prevCutoff) {
            prevSums[exp.category] = (prevSums[exp.category] || 0) + converted;
            prevTotal += converted;
          }
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

    const curRange = formatDayRangeLabel(currentMonthKey, curCutoff);
    const prevRange = formatDayRangeLabel(previousMonthKey, prevCutoff);
    const prevFullRange = formatDayRangeLabel(previousMonthKey, prevDays);

    const diffVal = curTotal - prevTotal;
    const diffPct = prevTotal > 0 ? (diffVal / prevTotal) * 100 : null;

    const totalBars: TotalComparisonRow[] = [
      {
        key: 'current',
        name: t('charts.mtdBarCurrent', {
          month: currentMonthNum,
          range: curRange,
          defaultValue: `Tháng ${currentMonthNum} (${curRange})`,
        }),
        amount: curTotal,
        subLabel: curRange,
      },
      {
        key: 'prevSamePeriod',
        name: t('charts.mtdBarPrevSame', {
          month: prevMonthNum,
          range: prevRange,
          defaultValue: `Tháng ${prevMonthNum} (${prevRange})`,
        }),
        amount: prevTotal,
        subLabel: prevRange,
      },
      {
        key: 'prevFullMonth',
        name: t('charts.mtdBarPrevFull', {
          month: prevMonthNum,
          defaultValue: `Cả tháng ${prevMonthNum}`,
        }),
        amount: prevFullTotal,
        subLabel: prevFullRange,
      },
    ];

    return {
      categoryData: rows,
      totalBarData: totalBars,
      cutoffDay: curCutoff,
      currentRangeLabel: curRange,
      previousRangeLabel: prevRange,
      currentPeriodTotal: curTotal,
      previousPeriodTotal: prevTotal,
      previousFullMonthTotal: prevFullTotal,
      totalDiff: diffVal,
      totalDiffPercent: diffPct,
    };
  }, [
    expenses,
    currentMonthKey,
    previousMonthKey,
    currentMonthNum,
    prevMonthNum,
    categories,
    baseCurrency,
    translateCategory,
    t,
  ]);

  const formatShortTick = (value: number) => {
    if (value === 0) return '0';
    if (baseCurrency === 'VND') {
      return value >= 1000000
        ? `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}tr`
        : `${(value / 1000).toFixed(0)}k`;
    }
    return value >= 1000
      ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
      : `${value}`;
  };

  const renderTotalTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item: TotalComparisonRow = payload[0]?.payload;
    if (!item) return null;

    return (
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 px-3.5 py-2.5 shadow-xl text-xs text-slate-100 min-w-[180px] tabular-nums">
        <p className="font-extrabold text-white mb-1">{item.name}</p>
        <p className="text-sm font-black text-cyan-300">
          {formatCurrency(item.amount, baseCurrency)}
        </p>
        {item.key === 'current' && previousPeriodTotal > 0 && (
          <p
            className={cn(
              'mt-1.5 pt-1.5 border-t border-white/10 font-bold',
              totalDiff > 0
                ? 'text-rose-400'
                : totalDiff < 0
                ? 'text-emerald-400'
                : 'text-slate-300'
            )}
          >
            {totalDiff > 0
              ? t('charts.mtdSpentMore', {
                  amount: formatCurrency(totalDiff, baseCurrency),
                  defaultValue: `Chi nhiều hơn ${formatCurrency(totalDiff, baseCurrency)}`,
                })
              : totalDiff < 0
              ? t('charts.mtdSpentLess', {
                  amount: formatCurrency(Math.abs(totalDiff), baseCurrency),
                  defaultValue: `Giảm ${formatCurrency(Math.abs(totalDiff), baseCurrency)}`,
                })
              : t('charts.mtdSameSpend', { defaultValue: 'Bằng cùng kỳ tháng trước' })}
          </p>
        )}
      </div>
    );
  };

  const renderCategoryTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const row: ComparisonRow = payload[0]?.payload;
    if (!row) return null;

    const isIncrease = row.diff > 0;
    const isDecrease = row.diff < 0;

    return (
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 px-3.5 py-2.5 shadow-xl text-xs text-slate-100 min-w-[210px]">
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
            <span className="text-slate-400">
              {isIncrease
                ? t('charts.mtdDiffHigher', { defaultValue: 'Tăng' })
                : isDecrease
                ? t('charts.mtdDiffLower', { defaultValue: 'Giảm' })
                : t('charts.mtdDifference', { defaultValue: 'Chênh lệch' })}
            </span>
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

  const hasAnyData =
    viewMode === 'total'
      ? currentPeriodTotal > 0 || previousPeriodTotal > 0 || previousFullMonthTotal > 0
      : categoryData.length > 0;

  const isPrivacy = getGlobalPrivacyMode();

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />

      {/* Header Row: Title + Segmented Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/20 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              {t('charts.mtdTitle', { defaultValue: 'So sánh chi tiêu cùng kỳ' })}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t('charts.mtdSubtitle', {
              day: cutoffDay.toString().padStart(2, '0'),
              curMonth: currentMonthNum,
              prevMonth: prevMonthNum,
              defaultValue: `Tính từ ngày 01 đến ngày ${cutoffDay.toString().padStart(2, '0')}: Tháng ${currentMonthNum} so với Tháng ${prevMonthNum}`,
            })}
          </p>
        </div>

        {/* 2-Mode Segmented Switcher: Tổng chi | Theo danh mục */}
        <div className="flex items-center p-1 rounded-2xl bg-blue-950/5 dark:bg-slate-950/50 border border-white/70 dark:border-white/10 backdrop-blur-md self-start sm:self-auto shrink-0">
          <button
            type="button"
            id="mtd-mode-total"
            onClick={() => setViewMode('total')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
              viewMode === 'total'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {t('charts.mtdTabTotal', { defaultValue: 'Tổng chi' })}
          </button>
          <button
            type="button"
            id="mtd-mode-category"
            onClick={() => setViewMode('category')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
              viewMode === 'category'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {t('charts.mtdTabCategory', { defaultValue: 'Theo danh mục' })}
          </button>
        </div>
      </div>

      {/* Clear Comparison Summary Strip (Always visible, tabular-nums, hairline border) */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 mb-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50 text-xs tabular-nums">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t('charts.mtdCurrentPeriod', { range: currentRangeLabel, defaultValue: `Kỳ này (${currentRangeLabel})` })}:
            </span>
            <strong className="font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(currentPeriodTotal, baseCurrency)}
            </strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t('charts.mtdPreviousPeriod', { range: previousRangeLabel, defaultValue: `Cùng kỳ T${prevMonthNum} (${previousRangeLabel})` })}:
            </span>
            <strong className="font-bold text-slate-700 dark:text-slate-200">
              {formatCurrency(previousPeriodTotal, baseCurrency)}
            </strong>
          </div>
        </div>

        {/* Plain-language comparison delta */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 font-extrabold',
            totalDiff > 0
              ? 'text-rose-600 dark:text-rose-400'
              : totalDiff < 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {totalDiff > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          ) : totalDiff < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Minus className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            {totalDiff > 0
              ? t('charts.mtdDeltaUp', {
                  amount: formatCurrency(totalDiff, baseCurrency),
                  defaultValue: `Tăng ${formatCurrency(totalDiff, baseCurrency)}`,
                })
              : totalDiff < 0
              ? t('charts.mtdDeltaDown', {
                  amount: formatCurrency(Math.abs(totalDiff), baseCurrency),
                  defaultValue: `Giảm ${formatCurrency(Math.abs(totalDiff), baseCurrency)}`,
                })
              : t('charts.mtdDeltaEqual', { defaultValue: 'Không đổi' })}
            {totalDiffPercent !== null && totalDiff !== 0 && (
              <span className="ml-1 font-bold">
                ({totalDiff > 0 ? '+' : ''}
                {totalDiffPercent.toFixed(1)}%)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Chart Area */}
      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium text-center">
          <p>
            {t('charts.mtdNoData', {
              currentRange: currentRangeLabel,
              previousRange: previousRangeLabel,
              defaultValue: `Chưa có khoản chi nào trong khoảng ${currentRangeLabel} hoặc ${previousRangeLabel}.`,
            })}
          </p>
        </div>
      ) : viewMode === 'total' ? (
        <div className="w-full" style={{ minWidth: 0, height: 290 }}>
          {isMounted && (
            <ResponsiveContainer width="100%" height={290} minWidth={0}>
              <BarChart
                data={totalBarData}
                margin={{ top: 26, right: 16, left: 0, bottom: 8 }}
                barCategoryGap="28%"
              >
                <defs>
                  <linearGradient id="mtdTotalCurrentGrad" x1="0" y1="0" x2="0" y2="1">
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
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
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
                  content={renderTotalTooltip}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={68}>
                  <LabelList
                    dataKey="amount"
                    position="top"
                    content={(props: any) => {
                      const { x, y, width, value } = props;
                      if (value === undefined || value === null) return null;
                      const labelText = isPrivacy
                        ? '••••'
                        : formatCompactCurrency(Number(value), baseCurrency, isPrivacy);
                      return (
                        <text
                          x={Number(x) + Number(width) / 2}
                          y={Number(y) - 8}
                          textAnchor="middle"
                          className="fill-slate-700 dark:fill-slate-200 text-xs font-extrabold tabular-nums"
                        >
                          {labelText}
                        </text>
                      );
                    }}
                  />
                  {totalBarData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={
                        entry.key === 'current'
                          ? 'url(#mtdTotalCurrentGrad)'
                          : entry.key === 'prevSamePeriod'
                          ? '#94a3b8'
                          : '#cbd5e1'
                      }
                      fillOpacity={entry.key === 'prevFullMonth' ? 0.65 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="w-full" style={{ minWidth: 0, height: 300 }}>
          {isMounted && (
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <BarChart
                data={categoryData}
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
                  content={renderCategoryTooltip}
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
