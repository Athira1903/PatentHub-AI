import React from 'react';
import { type CalendarEventItem, getCategoryConfig } from './calendarUtils';
import { Flag, Plus } from 'lucide-react';

interface CalendarMonthViewProps {
  currentDate: Date;
  selectedDate?: Date | null;
  events: CalendarEventItem[];
  onEventClick: (event: CalendarEventItem) => void;
  onDateClick: (date: Date) => void;
  onAddEventForDate?: (date: Date) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  selectedDate,
  events,
  onEventClick,
  onDateClick,
  onAddEventForDate,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days from previous month to fill the first row
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    prevMonthDays.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(year, month - 1, d),
    });
  }

  // Days of current month
  const currentMonthDays: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Days of next month to complete grid (total cells multiple of 7)
  const totalRendered = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
  const nextMonthDays: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Helper to test if two dates are the same calendar day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  // Group events by day
  const getEventsForDay = (date: Date) => {
    return events.filter((ev) => {
      const evStart = new Date(ev.startDate);
      const evEnd = new Date(ev.endDate);

      // Event is on this day if date is between start and end
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      return evStart <= dayEnd && evEnd >= dayStart;
    });
  };

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white border border-[#E5E7E5] rounded-3xl overflow-hidden shadow-xs">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-[#E5E7E5] bg-[#FAF9F6] text-center py-2.5">
        {weekDayHeaders.map((dayName) => (
          <div key={dayName} className="text-xs font-bold text-[#5C6662] uppercase tracking-wider">
            {dayName}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#E5E7E5] bg-[#E5E7E5]">
        {allCalendarDays.map((cell, idx) => {
          const isToday = isSameDay(cell.date, today);
          const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
          const dayEvents = getEventsForDay(cell.date);
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const extraCount = dayEvents.length - maxVisible;

          return (
            <div
              key={idx}
              onClick={() => onDateClick(cell.date)}
              className={`min-h-[115px] sm:min-h-[135px] p-1.5 sm:p-2 bg-white transition-all duration-150 flex flex-col justify-between group cursor-pointer hover:bg-[#FAF9F6] ${
                isSelected
                  ? 'ring-2 ring-inset ring-[#235952] bg-[#FAF9F6]'
                  : !cell.isCurrentMonth
                  ? 'bg-slate-50/60 opacity-55'
                  : ''
              }`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between pb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday
                      ? 'bg-[#235952] text-white shadow-3xs'
                      : isSelected
                      ? 'bg-[#235952]/15 text-[#235952] font-black'
                      : cell.isCurrentMonth
                      ? 'text-[#191F1D]'
                      : 'text-[#88928E]'
                  }`}
                >
                  {cell.day}
                </span>

                <button
                  type="button"
                  title="Schedule event on this date"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddEventForDate) {
                      onAddEventForDate(cell.date);
                    } else {
                      onDateClick(cell.date);
                    }
                  }}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[#88928E] hover:text-[#235952] hover:bg-[#E4F0EC] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Event Pills */}
              <div className="space-y-1 flex-1 overflow-hidden pt-0.5">
                {visibleEvents.map((ev) => {
                  const conf = getCategoryConfig(ev.category);
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      title={`${ev.title} (${conf.label})`}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border truncate flex items-center gap-1 cursor-pointer transition hover:opacity-85 shadow-3xs ${conf.bg} ${conf.border} ${conf.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} />
                      <span className="truncate">{ev.title}</span>
                      {ev.isOverdue && (
                        <Flag className="w-2.5 h-2.5 text-rose-600 shrink-0 ml-auto" />
                      )}
                    </div>
                  );
                })}

                {extraCount > 0 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(cell.date);
                    }}
                    className="text-[10px] font-bold text-[#235952] hover:underline px-1 cursor-pointer"
                  >
                    +{extraCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
