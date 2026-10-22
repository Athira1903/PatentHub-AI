import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { CalendarToolbar, type CalendarViewMode } from '../components/calendar/CalendarToolbar';
import { CalendarMonthView } from '../components/calendar/CalendarMonthView';
import { CalendarWeekView } from '../components/calendar/CalendarWeekView';
import { CalendarAgendaView } from '../components/calendar/CalendarAgendaView';
import { CalendarEventModal } from '../components/calendar/CalendarEventModal';
import { CalendarEventDetailsModal } from '../components/calendar/CalendarEventDetailsModal';
import { type CalendarEventItem, CATEGORY_CONFIG } from '../components/calendar/calendarUtils';
import { api, patentApi } from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, AlertCircle, AlertTriangle, Calendar, Clock, Plus, Flag, X } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectId = searchParams.get('project') || '';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleClearFilters = () => {
    setSelectedProjectId('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSearchParams({});
  };

  // Data states
  const [projects, setProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEventItem | null>(null);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<Date | null>(null);

  const [eventToDelete, setEventToDelete] = useState<CalendarEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects list
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const list = res.data?.projects || res.data || [];
        setProjects(list.map((p: any) => ({ id: p.id, title: p.title })));
      } catch (err) {
        console.error('Failed to fetch projects for calendar:', err);
      }
    };
    fetchProjects();
  }, []);

  // Compute date range for query based on viewMode and currentDate
  const getDateRangeForQuery = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    if (viewMode === 'month') {
      // Month with leading/trailing buffers
      const start = new Date(y, m - 1, 20);
      const end = new Date(y, m + 2, 10);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      const day = d.getDay();
      d.setDate(d.getDate() - day - 1);
      const start = new Date(d);
      d.setDate(d.getDate() + 9);
      const end = new Date(d);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    } else {
      // Agenda view: 3 months window
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m + 4, 0);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const range = getDateRangeForQuery();
      const params: any = {
        ...range,
      };
      if (selectedProjectId) params.projectId = selectedProjectId;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const res = await patentApi.getCalendarEvents(params);
      setEvents(res.data?.events || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode, selectedProjectId, selectedCategory, selectedStatus]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Date Heading text
  const getDateHeading = () => {
    const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (viewMode === 'week') {
      const d = new Date(currentDate);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      const startStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      d.setDate(d.getDate() + 6);
      const endStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    return monthName;
  };

  // Create / Update Event
  const handleSaveEvent = async (eventData: any) => {
    if (eventToEdit) {
      await patentApi.updateCalendarEvent(eventToEdit.sourceId, eventData);
      toast.success('Calendar event updated');
    } else {
      await patentApi.createCalendarEvent(eventData);
      toast.success('New event scheduled');
    }
    fetchEvents();
  };

  // Delete Event
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await patentApi.deleteCalendarEvent(eventToDelete.sourceId);
      toast.success('Event deleted');
      setEventToDelete(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Top Page Header */}
      <PageHeader
        title="Interactive Calendar"
        subtitle="Synchronize patent filing deadlines, project roadmap milestones, task due dates, and guide review meetings in one place."
        breadcrumbs={[
          { label: 'Platform', href: '/dashboard' },
          { label: 'Calendar' },
        ]}
      />

      {/* Calendar Toolbar */}
      <CalendarToolbar
        currentDateHeading={getDateHeading()}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        selectedProjectId={selectedProjectId}
        onProjectChange={(pId) => {
          setSelectedProjectId(pId);
          setSearchParams(pId ? { project: pId } : {});
        }}
        projects={projects}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onAddEvent={() => {
          setEventToEdit(null);
          setSelectedDateForNewEvent(new Date());
          setIsModalOpen(true);
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Main View Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-[#E5E7E5] rounded-3xl p-12 text-[#5C6662] space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-[#235952] animate-spin" />
          <span className="text-xs font-semibold">Loading synchronized calendar events...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white border border-rose-200 rounded-3xl shadow-xs space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h4 className="text-base font-bold text-[#191F1D]">Error Loading Calendar</h4>
          <p className="text-xs text-[#5C6662]">{error}</p>
          <button
            type="button"
            onClick={fetchEvents}
            className="px-4 py-2 bg-[#235952] text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : viewMode === 'month' ? (
        <CalendarMonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          events={events}
          onEventClick={(ev) => setSelectedEvent(ev)}
          onDateClick={(d) => {
            setSelectedDate((prev) => (prev && prev.getTime() === d.getTime() ? null : d));
          }}
          onAddEventForDate={(d) => {
            setEventToEdit(null);
            setSelectedDateForNewEvent(d);
            setIsModalOpen(true);
          }}
        />
      ) : viewMode === 'week' ? (
        <CalendarWeekView
          currentDate={currentDate}
          events={events}
          onEventClick={(ev) => setSelectedEvent(ev)}
          onDateClick={(d) => {
            setSelectedDate(d);
          }}
          onAddEventForDate={(d) => {
            setEventToEdit(null);
            setSelectedDateForNewEvent(d);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <CalendarAgendaView
          events={events}
          onEventClick={(ev) => setSelectedEvent(ev)}
          onAddEvent={() => {
            setEventToEdit(null);
            setSelectedDateForNewEvent(new Date());
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Selected Day Events Inspector */}
      {selectedDate && (
        <div className="bg-white border border-[#E5E7E5] rounded-3xl p-5 shadow-3xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#235952]" />
              <h3 className="text-sm font-bold text-[#191F1D]">
                Events for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEventToEdit(null);
                  setSelectedDateForNewEvent(selectedDate);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-[#235952] hover:bg-[#1B453F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event on this Date</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="p-1.5 text-[#5C6662] hover:text-[#191F1D] hover:bg-[#F1F3F4] rounded-xl transition cursor-pointer"
                title="Close Day Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of events on selectedDate */}
          {(() => {
            const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
            const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
            const dayEvents = events.filter((ev) => {
              const s = new Date(ev.startDate);
              const e = new Date(ev.endDate);
              return s <= dayEnd && e >= dayStart;
            });

            if (dayEvents.length === 0) {
              return (
                <div className="p-8 text-center text-xs text-[#5C6662] bg-[#FAF9F6] rounded-2xl border border-dashed border-[#E5E7E5]">
                  No events or deadlines scheduled for this date. Click "+ Add Event on this Date" to create one.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayEvents.map((ev) => {
                  const conf = CATEGORY_CONFIG[ev.category] || {
                    label: ev.category,
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    text: 'text-slate-700',
                    dot: 'bg-slate-500',
                  };
                  const startTime = new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endTime = new Date(ev.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-3.5 rounded-2xl border transition-all hover:shadow-xs cursor-pointer flex flex-col justify-between gap-2 ${conf.bg} ${conf.border} ${conf.text}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
                          {conf.label}
                        </span>
                        {ev.isOverdue && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Flag className="w-2.5 h-2.5" /> Overdue
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-[#191F1D] line-clamp-2">
                        {ev.title}
                      </h4>

                      <div className="flex items-center gap-2 text-[10px] opacity-75 font-medium pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{ev.allDay ? 'All Day' : `${startTime} - ${endTime}`}</span>
                        {ev.projectTitle && <span className="truncate max-w-[120px] ml-auto">({ev.projectTitle})</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Accessible Category Legend */}
      <div className="bg-white border border-[#E5E7E5] rounded-3xl p-5 shadow-3xs space-y-3">
        <h4 className="text-xs font-extrabold text-[#191F1D] uppercase tracking-wider">
          Event Categories Legend
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => (
            <div
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? '' : key)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-3xs ${
                selectedCategory === key ? 'ring-2 ring-[#235952]' : ''
              } ${conf.bg} ${conf.border} ${conf.text}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${conf.dot}`} />
              <span className="truncate text-[11px]">{conf.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Event Modal */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
          setSelectedDateForNewEvent(null);
        }}
        onSubmit={handleSaveEvent}
        eventToEdit={eventToEdit}
        projects={projects}
        initialDate={selectedDateForNewEvent}
      />

      {/* Event Details Modal */}
      <CalendarEventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(ev) => {
          setSelectedEvent(null);
          setEventToEdit(ev);
          setIsModalOpen(true);
        }}
        onDelete={(ev) => {
          setSelectedEvent(null);
          setEventToDelete(ev);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E5E7E5] rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#191F1D]">Delete Event?</h4>
              <p className="text-xs text-[#5C6662]">
                Are you sure you want to delete <strong>"{eventToDelete.title}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#F1F3F4] text-[#5C6662] rounded-xl text-xs font-bold hover:bg-[#E5E7E5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
