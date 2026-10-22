import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { playReminderBeep } from './soundEffects';

/**
 * Checks for upcoming calendar events and milestones within their reminder window,
 * plays a clear audible beep sound, and shows a high-priority reminder toast.
 */
export async function checkUpcomingReminders(navigate?: (path: string) => void) {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const now = new Date();
    // Look ahead 24 hours
    const lookahead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const res = await api.get('/calendar', {
      params: {
        startDate: now.toISOString(),
        endDate: lookahead.toISOString(),
      },
    });

    const events = res.data?.events || [];

    events.forEach((event: any) => {
      if (event.status === 'CANCELLED' || event.status === 'COMPLETED') return;

      const reminderMinutes =
        typeof event.reminderMinutes === 'number' && event.reminderMinutes > 0
          ? event.reminderMinutes
          : 30; // default 30 min if event has a general reminder scheduled

      if (!event.startDate) return;

      const eventStart = new Date(event.startDate).getTime();
      const currentMs = Date.now();
      const diffMinutes = (eventStart - currentMs) / (60 * 1000);

      // Trigger if event is starting within the reminder window (and hasn't started more than 1 min ago)
      if (diffMinutes > -1 && diffMinutes <= reminderMinutes) {
        const sessionKey = `patenthub_alerted_reminder_${event.id}_${Math.floor(eventStart / 60000)}`;
        if (sessionStorage.getItem(sessionKey)) return;

        sessionStorage.setItem(sessionKey, 'true');

        // Play the audible reminder beep sound!
        playReminderBeep(0.4);

        const timeString = new Date(event.startDate).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        const timeNotice =
          diffMinutes <= 1
            ? 'Starting right now!'
            : `Starting in ~${Math.round(diffMinutes)} mins (${timeString})`;

        // Show reminder notification toast
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/10 p-4 border-l-4 border-[#235952]`}
            >
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="shrink-0 pt-0.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#235952] font-black text-sm">
                      ⏰
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-black uppercase tracking-wider text-[#235952]">
                      Event Reminder Notification 🔊
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900 line-clamp-1">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                      {timeNotice}
                      {event.location ? ` • ${event.location}` : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="ml-3 flex items-center gap-1.5 border-l border-slate-100 pl-3">
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (navigate) {
                      navigate(event.navigationUrl || '/calendar');
                    } else if (typeof window !== 'undefined') {
                      window.location.href = event.navigationUrl || '/calendar';
                    }
                  }}
                  className="px-2.5 py-1.5 bg-[#235952] hover:bg-[#1B453F] text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="px-2 py-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ),
          { duration: 10000, position: 'top-right' }
        );
      }
    });
  } catch (err) {
    console.debug('Error checking upcoming reminders:', err);
  }
}

/**
 * Triggers a test reminder with the beep sound so users can hear and verify it.
 */
export function triggerTestReminderWithSound(title = 'Consultation with Patent Examiner') {
  // 1. Play the beep sound immediately
  playReminderBeep(0.4);

  // 2. Display the reminder notification toast
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/10 p-4 border-l-4 border-[#235952]`}
      >
        <div className="flex-1 w-0">
          <div className="flex items-start">
            <div className="shrink-0 pt-0.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#235952] font-black text-sm">
                🔔
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-[#235952]">
                Reminder Notification Test 🔊
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-900 line-clamp-1">
                {title}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                Beep sound played successfully! Audio notification is active.
              </p>
            </div>
          </div>
        </div>
        <div className="ml-3 flex items-center border-l border-slate-100 pl-3">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    ),
    { duration: 6000, position: 'top-right' }
  );
}

/**
 * React hook that registers background polling for upcoming event reminders.
 */
export function useReminderNotifier() {
  const navigate = useNavigate();

  useEffect(() => {
    // Initial check on mount
    checkUpcomingReminders(navigate);

    // Periodically poll every 45 seconds
    const interval = setInterval(() => {
      checkUpcomingReminders(navigate);
    }, 45000);

    return () => clearInterval(interval);
  }, [navigate]);
}
