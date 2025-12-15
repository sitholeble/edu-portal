import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Button,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MultiSelect, SelectOption } from '@/components/ui';
import { FamilyMember, useFamily } from '@/contexts/FamilyContext';

export default function FamilyScreen() {
  const router = useRouter();
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useFamily();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [age, setAge] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [filterRelationship, setFilterRelationship] = useState<string[]>([]);

  const handleAdd = () => {
    setIsAdding(true);
    setName('');
    setRelationship('');
    setAge('');
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setName(member.name);
    setRelationship(member.relationship);
    setAge(member.age?.toString() || '');
  };

  const handleSave = async () => {
    if (!name || !relationship) {
      Alert.alert('Error', 'Please fill in name and relationship');
      return;
    }

    if (editingId) {
      await updateFamilyMember(editingId, {
        name,
        relationship,
        age: age ? parseInt(age, 10) : undefined,
      });
      setEditingId(null);
    } else {
      await addFamilyMember({
        name,
        relationship,
        age: age ? parseInt(age, 10) : undefined,
      });
      setIsAdding(false);
    }
    setName('');
    setRelationship('');
    setAge('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setRelationship('');
    setAge('');
  };

  const handleDelete = (member: FamilyMember) => {
    Alert.alert(
      'Delete Family Member',
      `Are you sure you want to delete ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteFamilyMember(member.id);
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    if (selectedMemberIds.length === 0) return;
    
    Alert.alert(
      'Delete Selected Members',
      `Are you sure you want to delete ${selectedMemberIds.length} family member(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedMemberIds) {
              await deleteFamilyMember(id);
            }
            setSelectedMemberIds([]);
          },
        },
      ]
    );
  };

  const relationshipOptions: SelectOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Parent', value: 'Parent' },
    { label: 'Child', value: 'Child' },
    { label: 'Sibling', value: 'Sibling' },
    { label: 'Spouse', value: 'Spouse' },
    { label: 'Other', value: 'Other' },
  ];

  const filteredMembers = familyMembers.filter((member) => {
    if (filterRelationship.length === 0 || filterRelationship.includes('all')) {
      return true;
    }
    return filterRelationship.includes(member.relationship);
  });

  const renderMember = ({ item }: { item: FamilyMember }) => {
    if (editingId === item.id) {
      return (
        <ThemedView style={styles.memberCard}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="Relationship"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Age"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <View style={styles.editActions}>
            <Button title="Save" onPress={handleSave} color="#888" />
            <Button title="Cancel" onPress={handleCancel} color="#999" />
          </View>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <ThemedText type="subtitle" style={styles.memberName}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.memberRelationship}>{item.relationship}</ThemedText>
          {item.age && <ThemedText style={styles.memberAge}>Age: {item.age}</ThemedText>}
        </View>
        <View style={styles.memberActions}>
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
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Family Members</ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage your family members and their information
        </ThemedText>
        
        {/* Filter by Relationship */}
        <View style={styles.filterContainer}>
          <MultiSelect
            label="Filter by Relationship"
            options={relationshipOptions}
            selectedValues={filterRelationship}
            onSelectionChange={(values) => {
              setFilterRelationship(values as string[]);
            }}
            placeholder="All relationships"
            searchPlaceholder="Search relationships..."
            maxHeight={200}
          />
        </View>

        {/* Bulk Selection */}
        {filteredMembers.length > 0 && (
          <View style={styles.bulkActionsContainer}>
            <MultiSelect
              label="Select Members for Bulk Actions"
              options={filteredMembers.map((member) => ({
                label: `${member.name} (${member.relationship})`,
                value: member.id,
              }))}
              selectedValues={selectedMemberIds}
              onSelectionChange={(values) => {
                setSelectedMemberIds(values as string[]);
              }}
              placeholder="Select members..."
              searchPlaceholder="Search members..."
              maxHeight={200}
            />
            {selectedMemberIds.length > 0 && (
              <View style={styles.bulkActions}>
                <Button
                  title={`Delete Selected (${selectedMemberIds.length})`}
                  onPress={handleBulkDelete}
                  color="#dc3545"
                />
              </View>
            )}
          </View>
        )}
      </ThemedView>

      {isAdding && (
        <ThemedView style={styles.addCard}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="Relationship"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Age (optional)"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <View style={styles.addActions}>
            <Button title="Add" onPress={handleSave} disabled={!name || !relationship} color="#888" />
            <Button title="Cancel" onPress={handleCancel} color="#999" />
          </View>
        </ThemedView>
      )}

      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              {filterRelationship.length > 0 && !filterRelationship.includes('all')
                ? 'No family members found with selected relationship'
                : 'No family members yet'}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {filterRelationship.length > 0 && !filterRelationship.includes('all')
                ? 'Try selecting a different relationship filter'
                : 'Add your first family member to get started'}
            </ThemedText>
          </ThemedView>
        }
      />

      {!isAdding && (
        <View style={styles.footer}>
          <Button title="Add Family Member" onPress={handleAdd} color="#888" />
        </View>
      )}
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
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
    marginBottom: 16,
  },
  filterContainer: {
    marginTop: 16,
    marginBottom: 12,
  },
  bulkActionsContainer: {
    marginTop: 16,
    marginBottom: 12,
  },
  bulkActions: {
    marginTop: 12,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  memberCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  memberInfo: {
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberRelationship: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  memberAge: {
    fontSize: 12,
    opacity: 0.6,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#888',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#888',
  },
  deleteText: {
    color: '#fff',
  },
  addCard: {
    padding: 20,
    margin: 20,
    marginBottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  addActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
});

