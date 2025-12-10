import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CalendarEvent, useCalendar } from '@/contexts/CalendarContext';
import { useFamily } from '@/contexts/FamilyContext';

type ViewMode = 'list' | 'daily' | 'weekly';

export default function CalendarScreen() {
  const router = useRouter();
  const { events, addEvent, updateEvent, deleteEvent, getDailySummary, getWeeklySummary } =
    useCalendar();
  const { familyMembers } = useFamily();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '',
    endTime: '',
    familyMemberId: '',
    category: '',
    location: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      startTime: '',
      endTime: '',
      familyMemberId: '',
      category: '',
      location: '',
    });
    setEditingEvent(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate?.split('T')[0] || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      familyMemberId: event.familyMemberId || '',
      category: event.category || '',
      location: event.location || '',
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.startDate) {
      Alert.alert('Error', 'Please fill in title and start date');
      return;
    }

    const eventData = {
      title: formData.title,
      description: formData.description || undefined,
      startDate: `${formData.startDate}${formData.startTime ? `T${formData.startTime}:00` : ''}`,
      endDate: formData.endDate
        ? `${formData.endDate}${formData.endTime ? `T${formData.endTime}:00` : ''}`
        : undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      familyMemberId: formData.familyMemberId || undefined,
      category: formData.category || undefined,
      location: formData.location || undefined,
    };

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await addEvent(eventData);
      }
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const handleDelete = (event: CalendarEvent) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvent(event.id);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderEvent = ({ item }: { item: CalendarEvent }) => {
    const familyMember = item.familyMemberId
      ? familyMembers.find((m) => m.id === item.familyMemberId)
      : null;

    return (
      <ThemedView style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <ThemedText type="subtitle" style={styles.eventTitle}>
            {item.title}
          </ThemedText>
          <View style={styles.eventActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
              <ThemedText style={styles.actionText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <ThemedText style={[styles.actionText, styles.deleteText]}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <ThemedText style={styles.eventDate}>{formatDate(item.startDate)}</ThemedText>
        {item.startTime && (
          <ThemedText style={styles.eventTime}>
            {formatTime(item.startTime)}
            {item.endTime && ` - ${formatTime(item.endTime)}`}
          </ThemedText>
        )}
        {item.description && (
          <ThemedText style={styles.eventDescription}>{item.description}</ThemedText>
        )}
        {familyMember && (
          <ThemedText style={styles.eventMember}>👤 {familyMember.name}</ThemedText>
        )}
        {item.category && (
          <ThemedText style={styles.eventCategory}>🏷️ {item.category}</ThemedText>
        )}
        {item.location && (
          <ThemedText style={styles.eventLocation}>📍 {item.location}</ThemedText>
        )}
      </ThemedView>
    );
  };

  const renderDailyView = () => {
    const summary = getDailySummary(selectedDate);
    return (
      <View style={styles.summaryContainer}>
        <ThemedText type="title" style={styles.summaryTitle}>
          {formatDate(selectedDate.toISOString())}
        </ThemedText>
        <ThemedText style={styles.summaryCount}>
          {summary.count} {summary.count === 1 ? 'event' : 'events'}
        </ThemedText>
        {summary.events.length > 0 ? (
          <FlatList
            data={summary.events}
            renderItem={renderEvent}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No events scheduled for this day</ThemedText>
          </ThemedView>
        )}
      </View>
    );
  };

  const renderWeeklyView = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    const summary = getWeeklySummary(startOfWeek);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.summaryContainer}>
        <ThemedText type="title" style={styles.summaryTitle}>
          Week Summary
        </ThemedText>
        <ThemedText style={styles.summaryCount}>
          {summary.count} {summary.count === 1 ? 'event' : 'events'} this week
        </ThemedText>
        <ScrollView>
          {Object.entries(summary.byDay).map(([dateStr, dayEvents]) => {
            const date = new Date(dateStr);
            return (
              <ThemedView key={dateStr} style={styles.weekDayContainer}>
                <ThemedText type="subtitle" style={styles.weekDayHeader}>
                  {days[date.getDay()]}, {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </ThemedText>
                <ThemedText style={styles.weekDayCount}>
                  {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                </ThemedText>
                {dayEvents.map((event) => (
                  <ThemedView key={event.id} style={styles.weekEventItem}>
                    <ThemedText style={styles.weekEventTime}>
                      {event.startTime ? formatTime(event.startTime) : 'All day'}
                    </ThemedText>
                    <ThemedText style={styles.weekEventTitle}>{event.title}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      const timeA = a.startTime || '00:00';
      const timeB = b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });

    return (
      <FlatList
        data={sortedEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No events yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Add your first calendar event to get started
            </ThemedText>
          </ThemedView>
        }
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Calendar</ThemedText>
        <View style={styles.viewModeSelector}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
          >
            <ThemedText
              style={[
                styles.viewModeText,
                viewMode === 'list' && styles.viewModeTextActive,
              ]}
            >
              List
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('daily')}
            style={[styles.viewModeButton, viewMode === 'daily' && styles.viewModeButtonActive]}
          >
            <ThemedText
              style={[
                styles.viewModeText,
                viewMode === 'daily' && styles.viewModeTextActive,
              ]}
            >
              Daily
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('weekly')}
            style={[styles.viewModeButton, viewMode === 'weekly' && styles.viewModeButtonActive]}
          >
            <ThemedText
              style={[
                styles.viewModeText,
                viewMode === 'weekly' && styles.viewModeTextActive,
              ]}
            >
              Weekly
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {viewMode === 'list' && renderListView()}
      {viewMode === 'daily' && renderDailyView()}
      {viewMode === 'weekly' && renderWeeklyView()}

      <View style={styles.footer}>
        <Button title="Add Event" onPress={handleAdd} color="#888" />
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ScrollView>
              <ThemedText type="title" style={styles.modalTitle}>
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </ThemedText>

              <ThemedText style={styles.label}>Title *</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Event title"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Event description"
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.label}>Start Date *</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.label}>Start Time</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.startTime}
                onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                placeholder="HH:mm (e.g., 14:30)"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.label}>End Date</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.endDate}
                onChangeText={(text) => setFormData({ ...formData, endDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.label}>End Time</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.endTime}
                onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                placeholder="HH:mm (e.g., 16:00)"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.label}>Family Member</ThemedText>
              <View style={styles.picker}>
                <Button
                  title={formData.familyMemberId ? familyMembers.find((m) => m.id === formData.familyMemberId)?.name || 'Select' : 'Select Family Member'}
                  onPress={() => {
                    // Simple selection - in a real app, use a proper picker
                    if (familyMembers.length > 0) {
                      const index = familyMembers.findIndex((m) => m.id === formData.familyMemberId);
                      const nextIndex = (index + 1) % (familyMembers.length + 1);
                      if (nextIndex === 0) {
                        setFormData({ ...formData, familyMemberId: '' });
                      } else {
                        setFormData({ ...formData, familyMemberId: familyMembers[nextIndex - 1].id });
                      }
                    }
                  }}
                />
              </View>

              <ThemedText style={styles.label}>Category</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="e.g., School, Activity, Appointment"
                placeholderTextColor="#999"
              />

              <ThemedText style={styles.label}>Location</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Event location"
                placeholderTextColor="#999"
              />

              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => {
                  setIsModalVisible(false);
                  resetForm();
                }} color="#999" />
                <Button title="Save" onPress={handleSave} />
              </View>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  viewModeSelector: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  viewModeButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  viewModeButtonActive: {
    backgroundColor: '#666',
  },
  viewModeText: {
    color: '#000',
    fontWeight: '600',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  eventCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  deleteText: {
    color: '#fff',
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
  eventMember: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  eventCategory: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  eventLocation: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  summaryContainer: {
    padding: 20,
  },
  summaryTitle: {
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  weekDayContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  weekDayHeader: {
    marginBottom: 4,
  },
  weekDayCount: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  weekEventItem: {
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  weekEventTime: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 2,
  },
  weekEventTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  picker: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
});

