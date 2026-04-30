import { create } from 'zustand';

export interface Reminder {
  id: string;
  rowId: string;
  columnId: string;
  minutesBefore: number;
  notified: boolean;
  createdAt: string;
}

interface ReminderState {
  reminders: Reminder[];
  permissionStatus: 'default' | 'granted' | 'denied';
  requestPermission: () => Promise<boolean>;
  addReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
  markNotified: (id: string) => void;
  checkReminders: (rows: { id: string; cells: Record<string, any> }[], columnId: string) => void;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  permissionStatus: typeof Notification !== 'undefined' ? Notification.permission : 'default',

  requestPermission: async () => {
    if (typeof Notification === 'undefined') return false;
    try {
      const result = await Notification.requestPermission();
      set({ permissionStatus: result });
      return result === 'granted';
    } catch {
      return false;
    }
  },

  addReminder: (reminder) =>
    set((state) => ({
      reminders: [...state.reminders, reminder],
    })),

  removeReminder: (id) =>
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    })),

  markNotified: (id) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, notified: true } : r
      ),
    })),

  checkReminders: (rows, columnId) => {
    const { reminders, permissionStatus } = get();
    if (permissionStatus !== 'granted') return;

    const now = Date.now();

    for (const reminder of reminders) {
      if (reminder.notified) continue;

      const row = rows.find((r) => r.id === reminder.rowId);
      if (!row) continue;

      const cellValue = row.cells[columnId];
      if (typeof cellValue !== 'string' || !cellValue) continue;

      const datetime = new Date(cellValue).getTime();
      if (isNaN(datetime)) continue;

      const remindAt = datetime - reminder.minutesBefore * 60 * 1000;
      if (now >= remindAt && now < datetime + 60000) {
        // Show notification
        try {
          const notification = new Notification(
            reminder.minutesBefore === 0 ? 'Task Due Now' : `Task Due in ${reminder.minutesBefore} minutes`,
            {
              body: `Row ID: ${reminder.rowId}`,
              icon: '/favicon.ico',
            }
          );
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch {
          // Notifications might not be available
        }
        get().markNotified(reminder.id);
      }
    }
  },
}));