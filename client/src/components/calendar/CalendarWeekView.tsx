import React from 'react';
import { type CalendarEventItem, getCategoryConfig } from './calendarUtils';
import { Clock, Plus, Flag, MapPin, Video } from 'lucide-react';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onEventClick: (event: CalendarEventItem) => void;
  onDateClick: (date: Date) => void;
  onAddEventForDate?: (date: Date) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onAddEventForDate,
}) => {
  // Compute start of week (Sunday)
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getEventsForDay = (date: Date) => {
    return events.filter((ev) => {
      const evStart = new Date(ev.startDate);
      const evEnd = new Date(ev.endDate);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      return evStart <= dayEnd && evEnd >= dayStart;
    });
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="bg-white border border-[#E5E7E5] rounded-3xl overflow-hidden shadow-xs">
      {/* 7 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#E5E7E5]">
        {weekDays.map((date, idx) => {
          const isToday = isSameDay(date, today);
          const dayEvents = getEventsForDay(date);

          return (
            <div
              key={idx}
              className={`min-h-[220px] md:min-h-[480px] flex flex-col p-3 transition-colors ${
                isToday ? 'bg-[#FAF9F6]/80' : 'bg-white'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4]">
                <div>
                  <div className="text-[11px] font-bold text-[#88928E] uppercase tracking-wider">
                    {dayNames[idx].slice(0, 3)}
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 ${
                      isToday ? 'bg-[#235952] text-white shadow-3xs' : 'text-[#191F1D]'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>

                <button
                  type="button"
                  title="Add event on this date"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddEventForDate) {
                      onAddEventForDate(date);
                    } else {
                      onDateClick(date);
                    }
                  }}
                  className="p-1 text-[#88928E] hover:text-[#235952] hover:bg-[#E4F0EC] rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Events in Day Column */}
              <div className="pt-3 space-y-2 flex-1 overflow-y-auto">
                {dayEvents.length === 0 ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddEventForDate) {
                        onAddEventForDate(date);
                      } else {
                        onDateClick(date);
                      }
                    }}
                    className="h-full flex items-center justify-center p-4 border border-dashed border-[#E5E7E5] rounded-2xl text-[11px] text-[#88928E] font-medium hover:border-[#CCD0CD] hover:bg-[#FAF9F6] transition cursor-pointer text-center"
                  >
                    + Add Event
                  </div>
                ) : (
                  dayEvents.map((ev) => {
                    const conf = getCategoryConfig(ev.category);
                    const startTime = new Date(ev.startDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={ev.id}
                        onClick={() => onEventClick(ev)}
                        className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition hover:shadow-xs space-y-1.5 ${conf.bg} ${conf.border} ${conf.text}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                            {conf.label}
                          </span>
                          {ev.isOverdue && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-full">
                              <Flag className="w-2.5 h-2.5" /> Overdue
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-[#191F1D] leading-tight line-clamp-2">
                          {ev.title}
                        </h4>

                        {!ev.allDay && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold opacity-75">
                            <Clock className="w-3 h-3" />
                            <span>{startTime}</span>
                          </div>
                        )}

                        {ev.location && (
                          <div className="flex items-center gap-1 text-[10px] opacity-75 truncate">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                        {ev.meetingUrl && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-bold truncate">
                            <Video className="w-3 h-3" />
                            <span className="truncate">Meeting link attached</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
