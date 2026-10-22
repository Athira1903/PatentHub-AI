import React, { useState } from 'react';
import { type CalendarEventItem, getCategoryConfig } from './calendarUtils';
import {
  Clock,
  Calendar,
  ExternalLink,
  Flag,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CalendarAgendaViewProps {
  events: CalendarEventItem[];
  onEventClick: (event: CalendarEventItem) => void;
  onAddEvent: () => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onEventClick,
  onAddEvent,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((ev) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      (ev.projectTitle && ev.projectTitle.toLowerCase().includes(q)) ||
      ev.category.toLowerCase().includes(q)
    );
  });

  const toLocalDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group events by local date string (YYYY-MM-DD)
  const groupedEvents = filteredEvents.reduce<Record<string, CalendarEventItem[]>>((acc, ev) => {
    const dateKey = toLocalDateKey(new Date(ev.startDate));
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ev);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedEvents).sort();

  const todayStr = toLocalDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateKey(tomorrow);

  const getDateHeader = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-[#E5E7E5] rounded-3xl p-6 shadow-xs space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F3F4] pb-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-[#88928E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events, filing deadlines, milestones, or tasks..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-[#E5E7E5] rounded-xl text-xs font-medium text-[#191F1D] focus:outline-none focus:border-[#235952] transition"
          />
        </div>
        <div className="text-xs font-bold text-[#5C6662]">
          {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'} scheduled
        </div>
      </div>

      {/* Grouped Agenda List */}
      {sortedDateKeys.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-[#88928E] mx-auto" />
          <h4 className="text-base font-bold text-[#191F1D]">No Calendar Events Found</h4>
          <p className="text-xs text-[#5C6662] max-w-sm mx-auto">
            {searchTerm
              ? 'No events match your search query. Try clearing the filter.'
              : 'There are no milestones, deadlines, or meetings scheduled for this period.'}
          </p>
          <button
            type="button"
            onClick={onAddEvent}
            className="px-4 py-2 bg-[#235952] hover:bg-[#1B453F] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-3xs"
          >
            Create First Event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDateKeys.map((dateKey) => {
            const dayList = groupedEvents[dateKey];
            const isToday = dateKey === todayStr;

            return (
              <div key={dateKey} className="space-y-3">
                {/* Date Group Heading */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      isToday
                        ? 'bg-[#235952] text-white shadow-3xs'
                        : 'bg-[#FAF9F6] border border-[#E5E7E5] text-[#191F1D]'
                    }`}
                  >
                    {getDateHeader(dateKey)}
                  </span>
                  <div className="h-px bg-[#F1F3F4] flex-1" />
                </div>

                {/* Event Items */}
                <div className="grid grid-cols-1 gap-2.5">
                  {dayList.map((ev) => {
                    const conf = getCategoryConfig(ev.category);
                    const startTime = new Date(ev.startDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const endTime = new Date(ev.endDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={ev.id}
                        onClick={() => onEventClick(ev)}
                        className={`group p-4 rounded-2xl border transition-all duration-150 hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-white hover:border-[#CCD0CD] ${
                          ev.isOverdue ? 'border-rose-200 bg-rose-50/10' : 'border-[#E5E7E5]'
                        }`}
                      >
                        {/* Left Side: Time, Category, Title */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${conf.bg} ${conf.border} ${conf.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                              {conf.label}
                            </span>

                            {ev.isOverdue && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                <Flag className="w-2.5 h-2.5" /> Overdue
                              </span>
                            )}

                            {ev.status === 'COMPLETED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                              </span>
                            )}

                            {ev.projectTitle && (
                              <span className="text-[11px] font-semibold text-[#5C6662] truncate max-w-[200px]">
                                • {ev.projectTitle}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-[#191F1D] group-hover:text-[#235952] transition-colors truncate">
                            {ev.title}
                          </h4>

                          {ev.description && (
                            <p className="text-xs text-[#5C6662] line-clamp-1">{ev.description}</p>
                          )}
                        </div>

                        {/* Right Side: Timing & Quick Link */}
                        <div className="flex items-center gap-3 shrink-0 sm:text-right">
                          <div className="space-y-0.5 text-xs text-[#5C6662]">
                            <div className="flex items-center sm:justify-end gap-1 font-semibold text-[#191F1D]">
                              <Clock className="w-3.5 h-3.5 text-[#5C6662]" />
                              <span>{ev.allDay ? 'All Day' : `${startTime} - ${endTime}`}</span>
                            </div>
                            {ev.assignedTo && (
                              <div className="text-[11px] text-[#88928E]">
                                {ev.assignedTo.fullName}
                              </div>
                            )}
                          </div>

                          {ev.navigationUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(ev.navigationUrl);
                              }}
                              title="Go to associated page"
                              className="p-2 text-[#5C6662] hover:text-[#235952] hover:bg-[#E4F0EC] rounded-xl transition cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
