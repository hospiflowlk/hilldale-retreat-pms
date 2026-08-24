import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

export interface DateRange {
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;   // YYYY-MM-DD or ''
  preset: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'Last 7 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateStr(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDisplayDate(str: string): string {
  if (!str) return '';
  const d = parseDateStr(str);
  if (!d) return str;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar navigation month (first day of viewed month)
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value.startDate) {
      const d = parseDateStr(value.startDate);
      if (d) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Range in selection progress
  const [selectingStart, setSelectingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectingStart(null);
        setHoverDate(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view month when opening
  useEffect(() => {
    if (isOpen && value.startDate) {
      const d = parseDateStr(value.startDate);
      if (d) setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [isOpen]);

  const prevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Calendar days grid
  const daysInGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Previous month filler days
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Mon as start of week (0=Mon, 6=Sun)
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        dateStr: formatDateStr(d),
        dayNum: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        dateStr: formatDateStr(d),
        dayNum: i,
        isCurrentMonth: true
      });
    }

    // Next month filler days to complete 35 or 42 grid
    const remaining = 42 - days.length;
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({
          dateStr: formatDateStr(d),
          dayNum: i,
          isCurrentMonth: false
        });
      }
    }

    return days;
  }, [viewDate]);

  const handleDateClick = (dateStr: string) => {
    if (!selectingStart) {
      // First click -> start date chosen, waiting for second click
      setSelectingStart(dateStr);
    } else {
      // Second click -> range completed!
      let start = selectingStart;
      let end = dateStr;
      if (end < start) {
        start = dateStr;
        end = selectingStart;
      }
      onChange({
        startDate: start,
        endDate: end,
        preset: 'custom'
      });
      setSelectingStart(null);
      setHoverDate(null);
      setIsOpen(false);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const now = new Date();
    const todayStr = formatDateStr(now);

    let start = '';
    let end = '';

    if (presetId === 'today') {
      start = todayStr;
      end = todayStr;
    } else if (presetId === 'yesterday') {
      const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yStr = formatDateStr(yDate);
      start = yStr;
      end = yStr;
    } else if (presetId === 'this_week') {
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      start = formatDateStr(weekAgo);
      end = todayStr;
    } else if (presetId === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      start = formatDateStr(startOfMonth);
      end = formatDateStr(endOfMonth);
    } else if (presetId === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      start = formatDateStr(startOfLastMonth);
      end = formatDateStr(endOfLastMonth);
    } else if (presetId === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      start = formatDateStr(startOfYear);
      end = formatDateStr(endOfYear);
    } else if (presetId === 'all') {
      start = '';
      end = '';
    }

    onChange({
      startDate: start,
      endDate: end,
      preset: presetId
    });
    setSelectingStart(null);
    setHoverDate(null);
    setIsOpen(false);
  };

  // Determine label for trigger button
  const triggerLabel = useMemo(() => {
    if (value.preset && value.preset !== 'custom') {
      const p = PRESETS.find(pr => pr.id === value.preset);
      if (p) return p.label;
    }
    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) {
        return formatDisplayDate(value.startDate);
      }
      return `${formatDisplayDate(value.startDate)} - ${formatDisplayDate(value.endDate)}`;
    }
    if (value.startDate) {
      return `From ${formatDisplayDate(value.startDate)}`;
    }
    return 'All Time';
  }, [value]);

  // Active range bounds for highlighting
  const currentStart = selectingStart || value.startDate;
  const currentEnd = selectingStart ? (hoverDate || selectingStart) : value.endDate;
  const effectiveStart = currentStart && currentEnd && currentStart > currentEnd ? currentEnd : currentStart;
  const effectiveEnd = currentStart && currentEnd && currentStart > currentEnd ? currentStart : currentEnd;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-surface-muted hover:bg-[#eae6de] border border-border rounded-xl px-3 py-1.5 text-xs text-text font-medium transition cursor-pointer shadow-2xs"
      >
        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate max-w-[200px]">{triggerLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Calendar Dropdown Modal / Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 z-50 bg-white border border-border rounded-2xl shadow-xl p-4 flex flex-col md:flex-row gap-4 w-[340px] md:w-[480px] animate-in fade-in zoom-in-95 duration-100">
          
          {/* Quick Presets Column */}
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:pr-4 md:border-r border-border min-w-[120px]">
            <span className="hidden md:block text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">
              Presets
            </span>
            {PRESETS.map((p) => {
              const isSelected = value.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between whitespace-nowrap cursor-pointer ${
                    isSelected 
                      ? 'bg-primary text-white font-semibold' 
                      : 'text-text hover:bg-surface-muted'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 hidden md:block" />}
                </button>
              );
            })}
          </div>

          {/* Single Interactive Calendar View */}
          <div className="flex-1 flex flex-col">
            {/* Header & Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-text">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-surface-muted text-secondary hover:text-text transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-surface-muted text-secondary hover:text-text transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Instruction helper */}
            <p className="text-[11px] text-secondary mb-2">
              {selectingStart 
                ? 'Click second date to complete range' 
                : 'Click a date to start selection'}
            </p>

            {/* Weekday Names */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-secondary uppercase mb-1">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInGrid.map((day, idx) => {
                const isStart = effectiveStart === day.dateStr;
                const isEnd = effectiveEnd === day.dateStr;
                const isInRange = effectiveStart && effectiveEnd && day.dateStr >= effectiveStart && day.dateStr <= effectiveEnd;
                const isCurrentMonth = day.isCurrentMonth;

                let cellClasses = 'relative h-8 flex items-center justify-center text-xs rounded-lg transition cursor-pointer ';
                
                if (isStart || isEnd) {
                  cellClasses += 'bg-primary text-white font-bold shadow-xs z-10 ';
                } else if (isInRange) {
                  cellClasses += 'bg-primary-light text-primary font-medium rounded-none ';
                  if (day.dateStr === effectiveStart) cellClasses += 'rounded-l-lg ';
                  if (day.dateStr === effectiveEnd) cellClasses += 'rounded-r-lg ';
                } else if (isCurrentMonth) {
                  cellClasses += 'text-text hover:bg-surface-muted ';
                } else {
                  cellClasses += 'text-secondary/40 hover:bg-surface-muted ';
                }

                return (
                  <button
                    key={`${day.dateStr}-${idx}`}
                    type="button"
                    onClick={() => handleDateClick(day.dateStr)}
                    onMouseEnter={() => selectingStart && setHoverDate(day.dateStr)}
                    className={cellClasses}
                  >
                    {day.dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer Summary / Range Preview */}
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-secondary font-mono">
                {effectiveStart && effectiveEnd ? (
                  `${effectiveStart} → ${effectiveEnd}`
                ) : (
                  'Select range'
                )}
              </span>
              {(value.startDate || value.endDate || value.preset !== 'all') && (
                <button
                  type="button"
                  onClick={() => handlePresetSelect('all')}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
