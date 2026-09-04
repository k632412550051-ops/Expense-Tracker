import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Expense, getCategoryColor } from '../types';
import { formatCurrency } from '../lib/utils';

interface PieChartWidgetProps {
  expenses: Expense[];
  title?: string;
  categoryColors?: Record<string, string>;
}

export function PieChartWidget({ expenses, title = "Cơ cấu chi tiêu tháng này", categoryColors }: PieChartWidgetProps) {
  const data = useMemo(() => {
    const sums: Record<string, number> = {};

    expenses.forEach(exp => {
      sums[exp.category] = (sums[exp.category] || 0) + exp.amount;
    });

    return Object.keys(sums).map((category) => ({
      name: category,
      value: sums[category],
      color: getCategoryColor(category, 'expense', categoryColors)
    })).filter(item => item.value > 0); // Only show categories with spending
  }, [expenses, categoryColors]);

  if (data.length === 0) {
    return (
      <div className="liquid-glass rounded-3xl p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col h-[350px] sm:h-[400px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />
        <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white mb-6 truncate tracking-tight" title={title}>{title}</h2>
        <div className="flex-1 flex items-center justify-center text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium text-center">
          Chưa có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-3xl p-6 relative shadow-xl shadow-blue-950/5 border border-white/85 dark:border-white/10 dark:bg-slate-900/60 flex flex-col min-h-[400px] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:opacity-30 pointer-events-none" />
      <h2 className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white mb-2 truncate tracking-tight" title={title}>{title}</h2>
      <div className="flex-1 w-full relative min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="75%"
              paddingAngle={3}
              dataKey="value"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, fill }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius * 1.2;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="13px" fontWeight="600">
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
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ 
                borderRadius: '16px', 
                background: 'rgba(15, 23, 42, 0.85)', 
                backdropFilter: 'blur(12px)', 
                border: '1px solid rgba(255, 255, 255, 0.15)', 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                color: '#f8fafc'
              }}
              itemStyle={{ color: '#f8fafc' }}
              labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Custom Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 mt-4 pt-4 border-t border-blue-100/40 dark:border-white/10">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-white/20 shadow-xs" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm truncate max-w-[150px]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
