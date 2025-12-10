import * as SecureStore from 'expo-secure-store';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

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

interface CalendarContextType {
  events: CalendarEvent[];
  isLoading: boolean;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => CalendarEvent | undefined;
  getEventsByDate: (date: Date) => CalendarEvent[];
  getEventsByDateRange: (startDate: Date, endDate: Date) => CalendarEvent[];
  getDailySummary: (date: Date) => { events: CalendarEvent[]; count: number };
  getWeeklySummary: (startDate: Date) => { events: CalendarEvent[]; count: number; byDay: Record<string, CalendarEvent[]> };
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const CALENDAR_EVENTS_KEY = 'calendar_events';

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const stored = await SecureStore.getItemAsync(CALENDAR_EVENTS_KEY);
      if (stored) {
        setEvents(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEvents = async (newEvents: CalendarEvent[]) => {
    try {
      await SecureStore.setItemAsync(CALENDAR_EVENTS_KEY, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error('Error saving calendar events:', error);
      throw error;
    }
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...events, newEvent];
    await saveEvents(updated);
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const updated = events.map((event) =>
      event.id === id
        ? { ...event, ...updates, updatedAt: new Date().toISOString() }
        : event
    );
    await saveEvents(updated);
  };

  const deleteEvent = async (id: string) => {
    const updated = events.filter((event) => event.id !== id);
    await saveEvents(updated);
  };

  const getEvent = (id: string) => {
    return events.find((event) => event.id === id);
  };

  const getEventsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => event.startDate.split('T')[0] === dateStr);
  };

  const getEventsByDateRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventDate = event.startDate.split('T')[0];
      return eventDate >= start && eventDate <= end;
    });
  };

  const getDailySummary = (date: Date) => {
    const dayEvents = getEventsByDate(date);
    return {
      events: dayEvents.sort((a, b) => {
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      }),
      count: dayEvents.length,
    };
  };

  const getWeeklySummary = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const weekEvents = getEventsByDateRange(startDate, endDate);
    const byDay: Record<string, CalendarEvent[]> = {};
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];
      byDay[dayStr] = [];
    }
    
    // Group events by day
    weekEvents.forEach((event) => {
      const eventDate = event.startDate.split('T')[0];
      if (byDay[eventDate]) {
        byDay[eventDate].push(event);
      }
    });
    
    // Sort events within each day by time
    Object.keys(byDay).forEach((day) => {
      byDay[day].sort((a, b) => {
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
  };

  return (
    <CalendarContext.Provider
      value={{
        events,
        isLoading,
        addEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        getEventsByDate,
        getEventsByDateRange,
        getDailySummary,
        getWeeklySummary,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}

