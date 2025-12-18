import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  familyMemberId?: string;
  category?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// Custom storage adapter for Expo SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('Error getting item from secure storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Error setting item in secure storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
    }
  },
};

interface CalendarState {
  // State
  events: CalendarEvent[];
  isLoading: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  loadEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => CalendarEvent | undefined;

  // Query methods
  getEventsByDate: (date: Date) => CalendarEvent[];
  getEventsByDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  getDailySummary: (date: Date) => { events: CalendarEvent[]; count: number };
  getWeeklySummary: (startDate: Date) => {
    events: CalendarEvent[];
    count: number;
    byDay: Record<string, CalendarEvent[]>;
  };
}

const CALENDAR_EVENTS_KEY = 'calendar_events';

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      // Initial state
      events: [],
      isLoading: false,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      loadEvents: async () => {
        try {
          set({ isLoading: true });
          const stored = await SecureStore.getItemAsync(CALENDAR_EVENTS_KEY);
          if (stored) {
            set({ events: JSON.parse(stored) });
          }
        } catch (error) {
          console.error('Error loading calendar events:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addEvent: async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newEvent: CalendarEvent = {
          ...eventData,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [...get().events, newEvent];
        try {
          await SecureStore.setItemAsync(CALENDAR_EVENTS_KEY, JSON.stringify(updated));
          set({ events: updated });
        } catch (error) {
          console.error('Error saving calendar event:', error);
          throw error;
        }
      },

      updateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
        const updated = get().events.map((event: CalendarEvent) =>
          event.id === id
            ? { ...event, ...updates, updatedAt: new Date().toISOString() }
            : event
        );
        try {
          await SecureStore.setItemAsync(CALENDAR_EVENTS_KEY, JSON.stringify(updated));
          set({ events: updated });
        } catch (error) {
          console.error('Error updating calendar event:', error);
          throw error;
        }
      },

      deleteEvent: async (id: string) => {
        const updated = get().events.filter((event: CalendarEvent) => event.id !== id);
        try {
          await SecureStore.setItemAsync(CALENDAR_EVENTS_KEY, JSON.stringify(updated));
          set({ events: updated });
        } catch (error) {
          console.error('Error deleting calendar event:', error);
          throw error;
        }
      },

      getEvent: (id: string) => {
        return get().events.find((event: CalendarEvent) => event.id === id);
      },

      // Query methods
      getEventsByDate: (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return get().events.filter((event: CalendarEvent) => event.startDate.split('T')[0] === dateStr);
      },

      getEventsByDateRange: (startDate: Date, endDate: Date) => {
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        return get().events.filter((event: CalendarEvent) => {
          const eventDate = event.startDate.split('T')[0];
          return eventDate >= start && eventDate <= end;
        });
      },

      getDailySummary: (date: Date) => {
        const dayEvents = get().getEventsByDate(date);
        return {
          events: dayEvents.sort((a: CalendarEvent, b: CalendarEvent) => {
            const timeA = a.startTime || '00:00';
            const timeB = b.startTime || '00:00';
            return timeA.localeCompare(timeB);
          }),
          count: dayEvents.length,
        };
      },

      getWeeklySummary: (startDate: Date) => {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        const weekEvents = get().getEventsByDateRange(startDate, endDate);
        const byDay: Record<string, CalendarEvent[]> = {};

        // Initialize all days
        for (let i = 0; i < 7; i++) {
          const day = new Date(startDate);
          day.setDate(day.getDate() + i);
          const dayStr = day.toISOString().split('T')[0];
          byDay[dayStr] = [];
        }

        // Group events by day
        weekEvents.forEach((event: CalendarEvent) => {
          const eventDate = event.startDate.split('T')[0];
          if (byDay[eventDate]) {
            byDay[eventDate].push(event);
          }
        });

        // Sort events within each day by time
        Object.keys(byDay).forEach((day) => {
          byDay[day].sort((a: CalendarEvent, b: CalendarEvent) => {
            const timeA = a.startTime || '00:00';
            const timeB = b.startTime || '00:00';
            return timeA.localeCompare(timeB);
          });
        });

        return {
          events: weekEvents,
          count: weekEvents.length,
          byDay,
        };
      },
    }),
    {
      name: 'calendar-storage',
      storage: createJSONStorage(() => secureStorage),
      // Only persist events, not loading state
      partialize: (state: CalendarState) => ({ events: state.events }),
    }
  )
);

