import * as SecureStore from 'expo-secure-store';
import { useFamilyStore, type FamilyMember } from '../familyStore';

// Clear store before each test
beforeEach(() => {
  // Reset Zustand store state
  useFamilyStore.setState({
    members: [],
    isLoading: false,
  });
  // Clear SecureStore mock
  (SecureStore as any).__clearStore();
});

describe('FamilyStore', () => {
  describe('Initial State', () => {
    it('should have empty members array initially', () => {
      const members = useFamilyStore.getState().members;
      expect(members).toEqual([]);
    });

    it('should have isLoading set to false initially', () => {
      const isLoading = useFamilyStore.getState().isLoading;
      expect(isLoading).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useFamilyStore.getState().setLoading(true);
      expect(useFamilyStore.getState().isLoading).toBe(true);

      useFamilyStore.getState().setLoading(false);
      expect(useFamilyStore.getState().isLoading).toBe(false);
    });
  });

  describe('addMember', () => {
    it('should add a new family member', async () => {
      const memberData = {
        name: 'John Doe',
        relationship: 'Child',
        age: 10,
      };

      await useFamilyStore.getState().addMember(memberData);

      const members = useFamilyStore.getState().members;
      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({
        name: 'John Doe',
        relationship: 'Child',
        age: 10,
      });
      expect(members[0].id).toBeDefined();
      expect(members[0].createdAt).toBeDefined();
      expect(members[0].updatedAt).toBeDefined();
    });

    it('should persist member to SecureStore', async () => {
      const memberData = {
        name: 'Jane Doe',
        relationship: 'Spouse',
      };

      await useFamilyStore.getState().addMember(memberData);

      // Verify SecureStore was called
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
      const stored = await SecureStore.getItemAsync('family_members');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Jane Doe');
    });

    it('should generate unique IDs for each member', async () => {
      await useFamilyStore.getState().addMember({
        name: 'Member 1',
        relationship: 'Child',
      });
      await useFamilyStore.getState().addMember({
        name: 'Member 2',
        relationship: 'Child',
      });

      const members = useFamilyStore.getState().members;
      expect(members[0].id).not.toBe(members[1].id);
    });
  });

  describe('updateMember', () => {
    it('should update an existing member', async () => {
      // Add a member first
      await useFamilyStore.getState().addMember({
        name: 'John',
        relationship: 'Child',
        age: 10,
      });

      const members = useFamilyStore.getState().members;
      const memberId = members[0].id;
      const originalUpdatedAt = members[0].updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update the member
      await useFamilyStore.getState().updateMember(memberId, {
        name: 'John Updated',
        age: 11,
      });

      const updatedMembers = useFamilyStore.getState().members;
      expect(updatedMembers[0].name).toBe('John Updated');
      expect(updatedMembers[0].age).toBe(11);
      expect(updatedMembers[0].relationship).toBe('Child'); // Unchanged
      expect(updatedMembers[0].updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should persist updates to SecureStore', async () => {
      await useFamilyStore.getState().addMember({
        name: 'Test',
        relationship: 'Child',
      });

      const memberId = useFamilyStore.getState().members[0].id;
      await useFamilyStore.getState().updateMember(memberId, { name: 'Updated' });

      const stored = await SecureStore.getItemAsync('family_members');
      const parsed = JSON.parse(stored!);
      expect(parsed[0].name).toBe('Updated');
    });

    it('should not update non-existent member', async () => {
      await useFamilyStore.getState().updateMember('non-existent-id', {
        name: 'Updated',
      });

      const members = useFamilyStore.getState().members;
      expect(members).toHaveLength(0);
    });
  });

  describe('deleteMember', () => {
    it('should delete a member by id', async () => {
      await useFamilyStore.getState().addMember({
        name: 'Member 1',
        relationship: 'Child',
      });
      await useFamilyStore.getState().addMember({
        name: 'Member 2',
        relationship: 'Child',
      });

      const members = useFamilyStore.getState().members;
      const memberId = members[0].id;

      await useFamilyStore.getState().deleteMember(memberId);

      const remainingMembers = useFamilyStore.getState().members;
      expect(remainingMembers).toHaveLength(1);
      expect(remainingMembers[0].name).toBe('Member 2');
    });

    it('should persist deletion to SecureStore', async () => {
      await useFamilyStore.getState().addMember({
        name: 'To Delete',
        relationship: 'Child',
      });

      const memberId = useFamilyStore.getState().members[0].id;
      await useFamilyStore.getState().deleteMember(memberId);

      const stored = await SecureStore.getItemAsync('family_members');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('getMember', () => {
    it('should return member by id', async () => {
      await useFamilyStore.getState().addMember({
        name: 'John',
        relationship: 'Child',
      });

      const memberId = useFamilyStore.getState().members[0].id;
      const member = useFamilyStore.getState().getMember(memberId);

      expect(member).toBeDefined();
      expect(member?.name).toBe('John');
    });

    it('should return undefined for non-existent id', () => {
      const member = useFamilyStore.getState().getMember('non-existent');
      expect(member).toBeUndefined();
    });
  });

  describe('loadMembers', () => {
    it('should load members from SecureStore', async () => {
      // Pre-populate SecureStore
      const testMembers: FamilyMember[] = [
        {
          id: 'test-1',
          name: 'Pre-loaded',
          relationship: 'Child',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      await SecureStore.setItemAsync('family_members', JSON.stringify(testMembers));

      await useFamilyStore.getState().loadMembers();

      const members = useFamilyStore.getState().members;
      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('Pre-loaded');
    });

    it('should set loading state during load', async () => {
      const loadPromise = useFamilyStore.getState().loadMembers();
      
      // Loading should be true during load
      expect(useFamilyStore.getState().isLoading).toBe(true);
      
      await loadPromise;
      
      // Loading should be false after load
      expect(useFamilyStore.getState().isLoading).toBe(false);
    });

    it('should handle empty SecureStore gracefully', async () => {
      await useFamilyStore.getState().loadMembers();
      const members = useFamilyStore.getState().members;
      expect(members).toEqual([]);
    });
  });

  describe('getMembersByRelationship', () => {
    it('should filter members by relationship', async () => {
      await useFamilyStore.getState().addMember({
        name: 'Child 1',
        relationship: 'Child',
      });
      await useFamilyStore.getState().addMember({
        name: 'Spouse 1',
        relationship: 'Spouse',
      });
      await useFamilyStore.getState().addMember({
        name: 'Child 2',
        relationship: 'Child',
      });

      const children = useFamilyStore.getState().getMembersByRelationship('Child');
      expect(children).toHaveLength(2);
      expect(children.every((m) => m.relationship === 'Child')).toBe(true);
    });

    it('should return empty array if no members match', async () => {
      await useFamilyStore.getState().addMember({
        name: 'Child',
        relationship: 'Child',
      });

      const spouses = useFamilyStore.getState().getMembersByRelationship('Spouse');
      expect(spouses).toEqual([]);
    });
  });

  describe('getMemberCount', () => {
    it('should return correct member count', async () => {
      expect(useFamilyStore.getState().getMemberCount()).toBe(0);

      await useFamilyStore.getState().addMember({
        name: 'Member 1',
        relationship: 'Child',
      });
      expect(useFamilyStore.getState().getMemberCount()).toBe(1);

      await useFamilyStore.getState().addMember({
        name: 'Member 2',
        relationship: 'Child',
      });
      expect(useFamilyStore.getState().getMemberCount()).toBe(2);
    });
  });
});

