import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense, Category, getCategoryColor } from '../types';
import { formatCurrency, formatCompactCurrency, cn } from '../lib/utils';
import { 
  Calendar as CalendarIcon, 
  List, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';

interface TransactionHistoryProps {
  expenses: Expense[];
  currentMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  categories: Category[];
  incomeCategories: Category[];
  categoryColors?: Record<string, string>;
  onToggleResolved: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export function TransactionHistory({
  expenses,
  currentMonth,
  onMonthChange,
  categories,
  incomeCategories,
  categoryColors,
  onToggleResolved,
  onDeleteExpense
}: TransactionHistoryProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterCategory, setFilterCategory] = useState<string>('Tất cả');
  const [filterResolved, setFilterResolved] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [showAllInList, setShowAllInList] = useState<boolean>(false);

  // Parse current year and month (1-indexed)
  const [yearStr, monthStr] = currentMonth.split('-');
  const currentYear = parseInt(yearStr, 10);
  const currentMonthNum = parseInt(monthStr, 10);

  // Check if viewing current actual month
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const actualCurrentMonth = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 7);
  const isViewingCurrentActualMonth = currentMonth === actualCurrentMonth;

  const [navDirection, setNavDirection] = useState<'prev' | 'next' | 'current'>('next');

  // Month navigation helpers
  const handlePrevMonth = () => {
    setNavDirection('prev');
    let year = currentYear;
    let month = currentMonthNum - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    onMonthChange(`${year}-${month.toString().padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    setNavDirection('next');
    let year = currentYear;
    let month = currentMonthNum + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    onMonthChange(`${year}-${month.toString().padStart(2, '0')}`);
  };

  const handleCurrentMonthReturn = () => {
    setNavDirection(currentMonth < actualCurrentMonth ? 'next' : 'prev');
    onMonthChange(actualCurrentMonth);
  };

  const todayDateStr = useMemo(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  }, []);

  // Filtered transactions for current month
  const filteredCurrentMonthTransactions = useMemo(() => {
    return expenses.filter(exp => {
      const matchMonth = exp.date.startsWith(currentMonth);
      const matchCat = filterCategory === 'Tất cả' || exp.category === filterCategory;
      const matchSearch = !searchQuery || 
        exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.note && exp.note.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchResolved = 
        filterResolved === 'all' ||
        (filterResolved === 'pending' && exp.isReimbursable && !exp.isResolved) ||
        (filterResolved === 'resolved' && exp.isReimbursable && exp.isResolved);
      return matchMonth && matchCat && matchSearch && matchResolved;
    });
  }, [expenses, currentMonth, filterCategory, searchQuery, filterResolved]);

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    filteredCurrentMonthTransactions.forEach(exp => {
      if (!map[exp.date]) {
        map[exp.date] = [];
      }
      map[exp.date].push(exp);
    });
    return map;
  }, [filteredCurrentMonthTransactions]);

  // Calendar grid calculation (Monday through Sunday)
  const calendarCells = useMemo(() => {
    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    
    // First day of current month
    const firstDay = new Date(currentYear, currentMonthNum - 1, 1);
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // In Vietnam / standard calendar: Monday is 0 offset, Sunday is 6 offset
    const dayOfWeek = firstDay.getDay();
    const leadingDays = (dayOfWeek + 6) % 7;

    // Previous month info
    const prevMonthLastDate = new Date(currentYear, currentMonthNum - 1, 0).getDate();
    const prevMonth = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
    const prevYear = currentMonthNum === 1 ? currentYear - 1 : currentYear;

    for (let i = leadingDays - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i;
      const dateStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: day, isCurrentMonth: false });
    }

    // Current month days
    const currentMonthDays = new Date(currentYear, currentMonthNum, 0).getDate();
    for (let day = 1; day <= currentMonthDays; day++) {
      const dateStr = `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: day, isCurrentMonth: true });
    }

    // Trailing days from next month to fill out the last week (multiple of 7)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const nextMonth = currentMonthNum === 12 ? 1 : currentMonthNum + 1;
    const nextYear = currentMonthNum === 12 ? currentYear + 1 : currentYear;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const dateStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${nextDay.toString().padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: nextDay, isCurrentMonth: false });
      nextDay++;
    }

    return cells;
  }, [currentYear, currentMonthNum]);

  // Days with transactions data for the selected day modal
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDayDate) return [];
    return expenses.filter(exp => exp.date === selectedDayDate);
  }, [expenses, selectedDayDate]);

  const selectedDayTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    selectedDayTransactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else if (!t.isResolved) {
        expense += t.amount;
      }
    });
    return { income, expense, balance: income - expense };
  }, [selectedDayTransactions]);

  const weekDayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="liquid-glass rounded-3xl overflow-hidden relative shadow-xl shadow-blue-950/5">
      {/* Specular highlight border line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 z-10 pointer-events-none" />

      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 border-b border-blue-100/40 dark:border-white/10 flex flex-col gap-4 relative z-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white/60 dark:ring-white/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
                  Lịch sử giao dịch
                </h2>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div className="overflow-hidden min-h-[18px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p 
                    key={`month-label-${currentMonth}`}
                    initial={{ opacity: 0, y: navDirection === 'prev' ? -6 : navDirection === 'next' ? 6 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: navDirection === 'prev' ? 6 : navDirection === 'next' ? -6 : 0 }}
                    transition={{ duration: 0.16 }}
                    className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5"
                  >
                    Tháng {monthStr}/{yearStr} • <span className="text-blue-600 dark:text-cyan-400 font-semibold">{filteredCurrentMonthTransactions.length}</span> giao dịch
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Month Stepper & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0">
            {/* Prev / Current Month / Next */}
            <div className="flex items-center liquid-glass-pill p-1 rounded-2xl border border-white/90 dark:border-white/15 relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <button
                onClick={handleCurrentMonthReturn}
                className={cn(
                  "relative px-3 py-1 text-xs font-bold rounded-xl transition-colors cursor-pointer z-10",
                  isViewingCurrentActualMonth 
                    ? "text-white" 
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
                )}
                title="Quay về tháng hiện tại"
              >
                {isViewingCurrentActualMonth && (
                  <motion.div
                    layoutId="historyActiveMonthIndicator"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                Tháng này
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* View Mode Toggle (Segmented Liquid Glass with sliding indicator) */}
            <div className="flex items-center p-1 rounded-2xl bg-blue-950/5 dark:bg-slate-900/60 border border-white/70 dark:border-white/15 backdrop-blur-md relative">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer z-10",
                  viewMode === 'calendar'
                    ? "text-blue-700 dark:text-cyan-400"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
                title="Xem dạng Lịch tháng"
              >
                {viewMode === 'calendar' && (
                  <motion.div
                    layoutId="historyViewModeIndicator"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/15 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">Lịch</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer z-10",
                  viewMode === 'list'
                    ? "text-blue-700 dark:text-cyan-400"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                )}
                title="Xem dạng Danh sách"
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="historyViewModeIndicator"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-md shadow-blue-500/10 border border-white/80 dark:border-white/15 -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <List className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">Danh sách</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-blue-500/60 dark:text-cyan-400/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo ghi chú hoặc danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-2xl text-sm bg-white/60 dark:bg-slate-900/70 border border-white/80 dark:border-white/15 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-inner shadow-blue-900/5"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-white/80 dark:border-white/15 rounded-2xl text-slate-700 dark:text-white bg-white/70 dark:bg-slate-900/70 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-2xs font-medium cursor-pointer"
              >
                <option value="Tất cả" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tất cả danh mục</option>
                <optgroup label="Khoản chi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {categories.map(cat => (
                    <option key={'exp_' + cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{cat}</option>
                  ))}
                </optgroup>
                <optgroup label="Khoản thu" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {incomeCategories.map(cat => (
                    <option key={'inc_' + cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{cat}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Resolved Status Filter */}
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <select
                value={filterResolved}
                onChange={(e) => setFilterResolved(e.target.value as 'all' | 'pending' | 'resolved')}
                className="border border-white/80 dark:border-white/15 rounded-2xl text-slate-700 dark:text-white bg-white/70 dark:bg-slate-900/70 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all shadow-2xs font-medium cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tất cả trạng thái</option>
                <option value="pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Chờ hoàn tiền</option>
                <option value="resolved" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Đã hoàn tiền</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Calendar or List */}
      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'calendar' ? (
          <motion.div
            key={`calendar-view-${currentMonth}`}
            initial={{ 
              opacity: 0, 
              x: navDirection === 'prev' ? -18 : navDirection === 'next' ? 18 : 0,
              scale: 0.99
            }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              x: navDirection === 'prev' ? 18 : navDirection === 'next' ? -18 : 0,
              scale: 0.99
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="p-3 sm:p-6 overflow-x-auto"
          >
            {/* Calendar Table / Grid */}
          <div className="min-w-[680px] border border-blue-100/50 dark:border-white/10 rounded-2xl overflow-hidden bg-white/40 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 bg-blue-50/50 dark:bg-slate-800/80 border-b border-blue-100/50 dark:border-white/10 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider py-3">
              {weekDayHeaders.map((day, idx) => (
                <div key={day} className={idx >= 5 ? "text-rose-500 font-extrabold" : ""}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-blue-100/40 dark:divide-white/10">
              {calendarCells.map((cell) => {
                const dayTransactions = transactionsByDate[cell.dateStr] || [];
                const isToday = cell.dateStr === todayDateStr;
                const isSelected = cell.dateStr === selectedDayDate;

                // Day totals
                const dayExpense = dayTransactions
                  .filter(e => e.type !== 'income' && !e.isResolved)
                  .reduce((sum, e) => sum + e.amount, 0);
                const dayIncome = dayTransactions
                  .filter(e => e.type === 'income')
                  .reduce((sum, e) => sum + e.amount, 0);

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => {
                      if (dayTransactions.length > 0 || cell.isCurrentMonth) {
                        setSelectedDayDate(cell.dateStr);
                      }
                    }}
                    className={cn(
                      "min-h-[110px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col transition-all cursor-pointer group select-none relative",
                      !cell.isCurrentMonth 
                        ? "bg-slate-100/20 dark:bg-slate-950/40 text-slate-300 dark:text-slate-600" 
                        : "bg-white/40 dark:bg-slate-900/40 hover:bg-blue-50/50 dark:hover:bg-slate-800/60",
                      isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50/60 dark:bg-blue-950/40 shadow-inner",
                      isToday && "bg-cyan-50/30 dark:bg-cyan-950/30"
                    )}
                  >
                    {/* Day Number and Daily Spend Indicator */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded-xl text-xs font-bold transition-all",
                          isToday
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/30"
                            : cell.isCurrentMonth
                            ? "text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-400 group-hover:bg-white/80 dark:group-hover:bg-slate-800"
                            : "text-slate-400 dark:text-slate-600"
                        )}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Daily Net indicator if transactions exist */}
                      {cell.isCurrentMonth && (dayExpense > 0 || dayIncome > 0) && (
                        <div className="flex items-center gap-1 text-[10px] font-bold leading-none">
                          {dayIncome > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold" title={`Tổng thu: ${formatCurrency(dayIncome)}`}>
                              +{formatCompactCurrency(dayIncome)}
                            </span>
                          )}
                          {dayExpense > 0 && (
                            <span className="text-rose-500 dark:text-rose-400 font-extrabold" title={`Tổng chi: ${formatCurrency(dayExpense)}`}>
                              -{formatCompactCurrency(dayExpense)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Google Calendar-Style Liquid Glass Event Chips */}
                    <div className="flex flex-col gap-1 overflow-hidden flex-1">
                      {dayTransactions.slice(0, 3).map((exp) => {
                        const catColor = getCategoryColor(exp.category, exp.type, categoryColors);
                        const isIncome = exp.type === 'income';

                        return (
                          <div
                            key={exp.id}
                            className="text-[11px] px-2 py-0.5 rounded-lg truncate flex items-center justify-between gap-1 font-semibold transition-all hover:scale-[1.02] border backdrop-blur-xs shadow-2xs"
                            style={{
                              backgroundColor: `${catColor}25`,
                              borderColor: `${catColor}50`,
                              borderLeftWidth: '3px',
                              borderLeftColor: catColor,
                            }}
                            title={`${exp.category}: ${formatCurrency(exp.amount)}${exp.note ? ` (${exp.note})` : ''}`}
                          >
                            <span className="truncate max-w-[85px] sm:max-w-[100px] text-slate-800 dark:text-slate-100">
                              {exp.note ? exp.note : exp.category}
                            </span>
                            <span
                              className="font-extrabold shrink-0 text-[10px]"
                              style={{ color: isIncome ? '#10b981' : catColor }}
                            >
                              {isIncome ? '+' : ''}{formatCompactCurrency(exp.amount)}
                            </span>
                          </div>
                        );
                      })}

                      {/* More items indicator */}
                      {dayTransactions.length > 3 && (
                        <div className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold px-1 hover:underline">
                          +{dayTransactions.length - 3} mục khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400" />
              Bấm vào ngày bất kỳ để xem chi tiết hoặc quản lý giao dịch.
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 rounded-full border border-white dark:border-white/15">
              Số ngày có chi tiêu: <span className="text-blue-600 dark:text-cyan-400 font-bold">{Object.keys(transactionsByDate).length}</span> ngày
            </span>
          </div>
        </motion.div>
      ) : (
        /* List View Mode with Liquid Glass rows */
        <motion.div
          key={`list-view-${currentMonth}`}
          initial={{ 
            opacity: 0, 
            x: navDirection === 'prev' ? -18 : navDirection === 'next' ? 18 : 0,
            scale: 0.99
          }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ 
            opacity: 0, 
            x: navDirection === 'prev' ? 18 : navDirection === 'next' ? -18 : 0,
            scale: 0.99
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="p-4 sm:p-6"
        >
          <AnimatePresence mode="wait">
            {filteredCurrentMonthTransactions.length === 0 ? (
              <motion.div 
                key="empty-list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-center py-14 text-slate-400 dark:text-slate-500 text-sm"
              >
                Không tìm thấy giao dịch nào trong tháng {monthStr}/{yearStr}.
              </motion.div>
            ) : (
              <div key="list-container" className="flex flex-col gap-2.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {(showAllInList 
                    ? filteredCurrentMonthTransactions 
                    : filteredCurrentMonthTransactions.slice(0, 5)
                  ).map((exp) => {
                    const catColor = getCategoryColor(exp.category, exp.type, categoryColors);
                    const isIncome = exp.type === 'income';

                    return (
                      <motion.div 
                        key={exp.id} 
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.18 } }}
                        transition={{ 
                          layout: { type: "spring", stiffness: 350, damping: 30 },
                          opacity: { duration: 0.2 },
                          y: { duration: 0.2 }
                        }}
                        className="flex justify-between items-center p-3.5 sm:p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/80 border border-white/90 dark:border-white/15 hover:border-blue-200/80 dark:hover:border-cyan-500/30 transition-colors shadow-xs hover:shadow-md group"
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                          {/* Color Tag / Pill with crystal glow */}
                          <span 
                            className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white dark:ring-white/20 shadow-xs" 
                            style={{ backgroundColor: catColor }}
                            title={exp.category}
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{exp.category}</span>
                              {exp.isReimbursable && (
                                <span className={cn(
                                  "text-[10px] px-2.5 py-0.5 rounded-full font-bold shrink-0 border",
                                  exp.isResolved 
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
                                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                )}>
                                  {exp.isResolved ? 'Đã hoàn tiền' : 'Chờ hoàn tiền'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {exp.date.split('-').reverse().join('/')}
                              </span>
                              {exp.note && (
                                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[320px]">
                                  • {exp.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className={cn(
                            "font-extrabold text-base tracking-tight",
                            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                          )}>
                            {isIncome ? '+' : '-'}{formatCurrency(exp.amount)}
                          </span>
                          <div className="flex items-center gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {exp.isReimbursable && (
                              <button
                                onClick={() => onToggleResolved(exp)}
                                className="px-2.5 py-1 text-xs text-blue-600 dark:text-cyan-400 hover:text-blue-700 bg-blue-50/60 dark:bg-blue-950/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/80 rounded-lg font-semibold transition-colors cursor-pointer"
                              >
                                {exp.isResolved ? 'Hoàn tác' : 'Đã nhận'}
                              </button>
                            )}
                            <button 
                              onClick={() => onDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredCurrentMonthTransactions.length > 5 && (
                  <button
                    onClick={() => setShowAllInList(!showAllInList)}
                    className="mt-3 w-full py-2.5 px-4 rounded-2xl liquid-glass-pill hover:bg-white dark:hover:bg-slate-800 text-xs sm:text-sm text-blue-600 dark:text-cyan-400 hover:text-blue-700 font-bold transition-all text-center border border-white/90 dark:border-white/15 shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {showAllInList ? (
                      <span>Thu gọn danh sách</span>
                    ) : (
                      <span>Xem thêm ({filteredCurrentMonthTransactions.length - 5} giao dịch khác)</span>
                    )}
                  </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Day Detail Modal / Popup when a day in the calendar is clicked (Liquid Glass dialog) */}
      <AnimatePresence>
        {selectedDayDate && (
          <motion.div 
            key="day-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDayDate(null)}
          >
            <motion.div 
              key="day-detail-dialog"
              layout
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="liquid-glass-elevated rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-white dark:border-white/15 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Specular Highlight line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-blue-100/40 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">
                    Ngày {selectedDayDate.split('-').reverse().join('/')}
                  </h3>
                  {selectedDayDate === todayDateStr && (
                    <span className="text-[11px] bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                      Hôm nay
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {selectedDayTransactions.length} giao dịch được ghi nhận
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDate(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day Financial Summary */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="liquid-glass p-3.5 rounded-2xl border border-rose-200/50 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/30">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Tổng chi
                </span>
                <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(selectedDayTotals.expense)}
                </p>
              </div>
              <div className="liquid-glass p-3.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/30">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Tổng thu
                </span>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(selectedDayTotals.income)}
                </p>
              </div>
            </div>

            {/* List of items on this day */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
              <AnimatePresence mode="wait">
                {selectedDayTransactions.length === 0 ? (
                  <motion.div 
                    key="empty-day"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm"
                  >
                    Không có giao dịch nào vào ngày này.
                  </motion.div>
                ) : (
                  <div key="day-list" className="flex flex-col gap-2.5">
                    <AnimatePresence initial={false} mode="popLayout">
                      {selectedDayTransactions.map((exp) => {
                        const catColor = getCategoryColor(exp.category, exp.type, categoryColors);
                        const isIncome = exp.type === 'income';

                        return (
                          <motion.div 
                            key={exp.id} 
                            layout
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.18 } }}
                            transition={{ 
                              layout: { type: "spring", stiffness: 350, damping: 30 },
                              opacity: { duration: 0.2 },
                              y: { duration: 0.2 }
                            }}
                            className="p-3.5 rounded-2xl border border-white/80 dark:border-white/15 bg-white/50 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800/70 flex items-start justify-between gap-3 transition-colors shadow-2xs"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <span 
                                className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 ring-2 ring-white dark:ring-white/20 shadow-xs" 
                                style={{ backgroundColor: catColor }} 
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{exp.category}</span>
                                {exp.note && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">{exp.note}</p>
                                )}
                                {exp.isReimbursable && (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                      exp.isResolved ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                    )}>
                                      {exp.isResolved ? 'Đã hoàn tiền' : 'Chờ hoàn tiền'}
                                    </span>
                                    <button
                                      onClick={() => onToggleResolved(exp)}
                                      className="text-[11px] text-blue-600 dark:text-cyan-400 hover:underline font-bold ml-1 cursor-pointer"
                                    >
                                      {exp.isResolved ? 'Hoàn tác' : 'Đã nhận tiền'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={cn(
                                "font-extrabold text-base",
                                isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                              )}>
                                {isIncome ? '+' : '-'}{formatCurrency(exp.amount)}
                              </span>
                              <button
                                onClick={() => {
                                  onDeleteExpense(exp.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                                title="Xóa giao dịch này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-2 border-t border-blue-100/40 dark:border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedDayDate(null)}
                className="px-5 py-2.5 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-bold text-sm rounded-2xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}
