import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Expense, getCategoryColor, CurrencyCode } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { getExpenseConvertedAmount } from '../lib/exchangeRates';
import { useCategoryTranslation } from '../lib/useCategoryTranslation';
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
  baseCurrency = 'VND',
}: CombinedPieChartWidgetProps) {
  const { t } = useTranslation();
  const { translateCategory } = useCategoryTranslation();

  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous'>('current');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeExpenses =
    selectedPeriod === 'current' ? currentMonthExpenses : previousMonthExpenses;
  const activeLabel =
    selectedPeriod === 'current' ? currentMonthLabel : previousMonthLabel;

  const { data, totalAmount } = useMemo(() => {
    const sums: Record<string, number> = {};
    let total = 0;

    activeExpenses.forEach((exp) => {
      const converted = getExpenseConvertedAmount(exp, baseCurrency);
      sums[exp.category] = (sums[exp.category] || 0) + converted;
      total += converted;
    });

    const chartData = Object.keys(sums)
      .map((category) => ({
        name: translateCategory(category),
        rawCategory: category,
        value: sums[category],
        color: getCategoryColor(category, 'expense', categoryColors),
      }))
      .filter((item) => item.value > 0);

    chartData.sort((a, b) => b.value - a.value);

    return { data: chartData, totalAmount: total };
  }, [activeExpenses, categoryColors, baseCurrency, translateCategory]);

  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name, fill } = props;
    const RADIAN = Math.PI / 180;
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);

    // Internal percentage coordinate (60% of outerRadius on a solid pie)
    const innerRadiusPos = outerRadius * 0.6;
    const ix = cx + innerRadiusPos * cos;
    const iy = cy + innerRadiusPos * sin;

    // External callout leader line coordinates
    const sx = cx + outerRadius * cos;
    const sy = cy + outerRadius * sin;
    const mx = cx + (outerRadius + 14) * cos;
    const my = cy + (outerRadius + 14) * sin;
    const isRight = cos >= 0;
    const ex = mx + (isRight ? 12 : -12);
    const ey = my;
    const tx = ex + (isRight ? 5 : -5);

    const displayName = name.length > 16 ? `${name.slice(0, 15)}…` : name;

    return (
      <g className="pointer-events-none">
        {/* Internal % for slices >= 5% */}
        {percent >= 0.05 && (
          <text
            x={ix}
            y={iy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            stroke="rgba(15, 23, 42, 0.45)"
            strokeWidth={2.5}
            paintOrder="stroke"
            fontSize="12px"
            fontWeight="800"
            className="tabular-nums"
          >
            {`${(percent * 100).toFixed(0)}%`}
          </text>
        )}

        {/* External leader line & Category name annotation */}
        <polyline
          points={`${sx},${sy} ${mx},${my} ${ex},${ey}`}
          fill="none"
          stroke={fill}
          strokeWidth={1.5}
          strokeOpacity={0.85}
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} />
        <text
          x={tx}
          y={ey}
          textAnchor={isRight ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize="11.5px"
          fontWeight="700"
          className="fill-slate-700 dark:fill-slate-200"
        >
          {displayName}
        </text>
      </g>
    );
  };

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const value = Number(item.value) || 0;
    const pct = totalAmount > 0 ? (value / totalAmount) * 100 : 0;
    const color = item.payload?.color || '#3b82f6';

    return (
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 px-3.5 py-2.5 shadow-xl text-xs text-slate-100 tabular-nums">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-extrabold text-white">{item.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">{t('charts.spentAmount')}:</span>
          <span className="font-bold text-white">
            {formatCurrency(value, baseCurrency)}{' '}
            <span className="text-cyan-300 font-semibold">({pct.toFixed(1)}%)</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col min-h-[400px] overflow-hidden">
      {/* Top specular highlight */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />

      {/* Header with Title & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/20 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              {t('charts.pieTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 tabular-nums">
            {t('charts.totalSpentLabel')}{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalAmount, baseCurrency)}
            </span>
          </p>
        </div>

        {/* Tab switcher: Tháng này / Tháng trước */}
        <div className="flex items-center p-1 rounded-2xl bg-blue-950/5 dark:bg-slate-950/50 border border-white/70 dark:border-white/10 backdrop-blur-md self-start sm:self-auto">
          <button
            type="button"
            id="pie-current-month-tab"
            onClick={() => setSelectedPeriod('current')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
              selectedPeriod === 'current'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {t('charts.monthTab', { month: currentMonthLabel })}
          </button>
          <button
            type="button"
            id="pie-prev-month-tab"
            onClick={() => setSelectedPeriod('previous')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
              selectedPeriod === 'previous'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-cyan-400 shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {t('charts.prevMonthTab', { month: previousMonthLabel })}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium">
          <p>{t('charts.noExpenseInMonth', { month: activeLabel })}</p>
        </div>
      ) : (
        <div className="w-full flex-1 flex items-center" style={{ minWidth: 0, height: 310 }}>
          {isMounted && (
            <ResponsiveContainer width="100%" height={310} minWidth={0}>
              <PieChart margin={{ top: 18, right: 20, bottom: 18, left: 20 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius="54%"
                  paddingAngle={0}
                  dataKey="value"
                  label={renderPieLabel}
                  labelLine={false}
                  className="stroke-white dark:stroke-slate-900"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={renderTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
