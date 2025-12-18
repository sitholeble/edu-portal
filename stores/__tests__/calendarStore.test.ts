import * as SecureStore from 'expo-secure-store';
import { useCalendarStore, type CalendarEvent } from '../calendarStore';

// Clear store before each test
beforeEach(() => {
  // Reset Zustand store state
  useCalendarStore.setState({
    events: [],
    isLoading: false,
  });
  // Clear SecureStore mock
  (SecureStore as any).__clearStore();
});

describe('CalendarStore', () => {
  describe('Initial State', () => {
    it('should have empty events array initially', () => {
      const events = useCalendarStore.getState().events;
      expect(events).toEqual([]);
    });

    it('should have isLoading set to false initially', () => {
      const isLoading = useCalendarStore.getState().isLoading;
      expect(isLoading).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useCalendarStore.getState().setLoading(true);
      expect(useCalendarStore.getState().isLoading).toBe(true);

      useCalendarStore.getState().setLoading(false);
      expect(useCalendarStore.getState().isLoading).toBe(false);
    });
  });

  describe('addEvent', () => {
    it('should add a new calendar event', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-15',
        startTime: '10:00',
      };

      await useCalendarStore.getState().addEvent(eventData);

      const events = useCalendarStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject(eventData);
      expect(events[0].id).toBeDefined();
      expect(events[0].createdAt).toBeDefined();
      expect(events[0].updatedAt).toBeDefined();
    });

    it('should persist event to SecureStore', async () => {
      const eventData = {
        title: 'Persisted Event',
        startDate: '2024-01-15',
      };

      await useCalendarStore.getState().addEvent(eventData);

      expect(SecureStore.setItemAsync).toHaveBeenCalled();
      const stored = await SecureStore.getItemAsync('calendar_events');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe('Persisted Event');
    });

    it('should generate unique IDs for each event', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Event 1',
        startDate: '2024-01-15',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Event 2',
        startDate: '2024-01-16',
      });

      const events = useCalendarStore.getState().events;
      expect(events[0].id).not.toBe(events[1].id);
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Original Title',
        startDate: '2024-01-15',
      });

      const eventId = useCalendarStore.getState().events[0].id;
      const originalUpdatedAt = useCalendarStore.getState().events[0].updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      await useCalendarStore.getState().updateEvent(eventId, {
        title: 'Updated Title',
      });

      const events = useCalendarStore.getState().events;
      expect(events[0].title).toBe('Updated Title');
      expect(events[0].startDate).toBe('2024-01-15'); // Unchanged
      expect(events[0].updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event by id', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Event 1',
        startDate: '2024-01-15',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Event 2',
        startDate: '2024-01-16',
      });

      const eventId = useCalendarStore.getState().events[0].id;
      await useCalendarStore.getState().deleteEvent(eventId);

      const events = useCalendarStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Event 2');
    });
  });

  describe('getEvent', () => {
    it('should return event by id', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Test Event',
        startDate: '2024-01-15',
      });

      const eventId = useCalendarStore.getState().events[0].id;
      const event = useCalendarStore.getState().getEvent(eventId);

      expect(event).toBeDefined();
      expect(event?.title).toBe('Test Event');
    });
  });

  describe('getEventsByDate', () => {
    it('should return events for a specific date', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Event on 15th',
        startDate: '2024-01-15',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Event on 16th',
        startDate: '2024-01-16',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Another on 15th',
        startDate: '2024-01-15T10:00:00Z',
      });

      const date = new Date('2024-01-15');
      const events = useCalendarStore.getState().getEventsByDate(date);

      expect(events).toHaveLength(2);
      expect(events.every((e) => e.startDate.startsWith('2024-01-15'))).toBe(true);
    });

    it('should return empty array if no events on date', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Event',
        startDate: '2024-01-15',
      });

      const date = new Date('2024-01-20');
      const events = useCalendarStore.getState().getEventsByDate(date);

      expect(events).toEqual([]);
    });
  });

  describe('getEventsByDateRange', () => {
    it('should return events within date range', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Event 1',
        startDate: '2024-01-15',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Event 2',
        startDate: '2024-01-18',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Event 3',
        startDate: '2024-01-20',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Event 4',
        startDate: '2024-01-25',
      });

      const startDate = new Date('2024-01-16');
      const endDate = new Date('2024-01-22');
      const events = useCalendarStore.getState().getEventsByDateRange(startDate, endDate);

      expect(events).toHaveLength(2);
      expect(events.map((e) => e.title)).toEqual(['Event 2', 'Event 3']);
    });
  });

  describe('getDailySummary', () => {
    it('should return events and count for a day', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'Morning Event',
        startDate: '2024-01-15',
        startTime: '09:00',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Evening Event',
        startDate: '2024-01-15',
        startTime: '18:00',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Afternoon Event',
        startDate: '2024-01-15',
        startTime: '14:00',
      });

      const date = new Date('2024-01-15');
      const summary = useCalendarStore.getState().getDailySummary(date);

      expect(summary.count).toBe(3);
      expect(summary.events).toHaveLength(3);
      // Events should be sorted by time
      expect(summary.events[0].startTime).toBe('09:00');
      expect(summary.events[1].startTime).toBe('14:00');
      expect(summary.events[2].startTime).toBe('18:00');
    });

    it('should handle events without time', async () => {
      await useCalendarStore.getState().addEvent({
        title: 'All Day Event',
        startDate: '2024-01-15',
      });

      const date = new Date('2024-01-15');
      const summary = useCalendarStore.getState().getDailySummary(date);

      expect(summary.count).toBe(1);
      expect(summary.events[0].startTime).toBeUndefined();
    });
  });

  describe('getWeeklySummary', () => {
    it('should return weekly summary with events grouped by day', async () => {
      // Add events across a week
      await useCalendarStore.getState().addEvent({
        title: 'Monday Event',
        startDate: '2024-01-15', // Monday
        startTime: '10:00',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Tuesday Event',
        startDate: '2024-01-16', // Tuesday
        startTime: '14:00',
      });
      await useCalendarStore.getState().addEvent({
        title: 'Monday Event 2',
        startDate: '2024-01-15',
        startTime: '15:00',
      });

      const startDate = new Date('2024-01-15');
      const summary = useCalendarStore.getState().getWeeklySummary(startDate);

      expect(summary.count).toBe(3);
      expect(summary.events).toHaveLength(3);
      expect(summary.byDay['2024-01-15']).toHaveLength(2);
      expect(summary.byDay['2024-01-16']).toHaveLength(1);
    });

    it('should initialize all 7 days in byDay', () => {
      const startDate = new Date('2024-01-15');
      const summary = useCalendarStore.getState().getWeeklySummary(startDate);

      const dayKeys = Object.keys(summary.byDay);
      expect(dayKeys).toHaveLength(7);
      // All days should be arrays (even if empty)
      dayKeys.forEach((day) => {
        expect(Array.isArray(summary.byDay[day])).toBe(true);
      });
    });
  });

  describe('loadEvents', () => {
    it('should load events from SecureStore', async () => {
      const testEvents: CalendarEvent[] = [
        {
          id: 'test-1',
          title: 'Pre-loaded Event',
          startDate: '2024-01-15',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      await SecureStore.setItemAsync('calendar_events', JSON.stringify(testEvents));

      await useCalendarStore.getState().loadEvents();

      const events = useCalendarStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Pre-loaded Event');
    });

    it('should set loading state during load', async () => {
      const loadPromise = useCalendarStore.getState().loadEvents();

      expect(useCalendarStore.getState().isLoading).toBe(true);

      await loadPromise;

      expect(useCalendarStore.getState().isLoading).toBe(false);
    });
  });
});

