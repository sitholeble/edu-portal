import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  dateOfBirth?: string;
  avatar?: string;
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

interface FamilyState {
  // State
  members: FamilyMember[];
  isLoading: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  loadMembers: () => Promise<void>;
  addMember: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getMember: (id: string) => FamilyMember | undefined;

  // Computed/Selectors
  getMembersByRelationship: (relationship: string) => FamilyMember[];
  getMemberCount: () => number;
}

const FAMILY_MEMBERS_KEY = 'family_members';

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      // Initial state
      members: [],
      isLoading: false,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      loadMembers: async () => {
        try {
          set({ isLoading: true });
          const stored = await SecureStore.getItemAsync(FAMILY_MEMBERS_KEY);
          if (stored) {
            set({ members: JSON.parse(stored) });
          }
        } catch (error) {
          console.error('Error loading family members:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addMember: async (memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newMember: FamilyMember = {
          ...memberData,
          id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [...get().members, newMember];
        try {
          await SecureStore.setItemAsync(FAMILY_MEMBERS_KEY, JSON.stringify(updated));
          set({ members: updated });
        } catch (error) {
          console.error('Error saving family member:', error);
          throw error;
        }
      },

      updateMember: async (id: string, updates: Partial<FamilyMember>) => {
        const updated = get().members.map((member: FamilyMember) =>
          member.id === id
            ? { ...member, ...updates, updatedAt: new Date().toISOString() }
            : member
        );
        try {
          await SecureStore.setItemAsync(FAMILY_MEMBERS_KEY, JSON.stringify(updated));
          set({ members: updated });
        } catch (error) {
          console.error('Error updating family member:', error);
          throw error;
        }
      },

      deleteMember: async (id: string) => {
        const updated = get().members.filter((member: FamilyMember) => member.id !== id);
        try {
          await SecureStore.setItemAsync(FAMILY_MEMBERS_KEY, JSON.stringify(updated));
          set({ members: updated });
        } catch (error) {
          console.error('Error deleting family member:', error);
          throw error;
        }
      },

      getMember: (id: string) => {
        return get().members.find((member: FamilyMember) => member.id === id);
      },

      // Computed values (selectors)
      getMembersByRelationship: (relationship: string) => {
        return get().members.filter((member: FamilyMember) => member.relationship === relationship);
      },

      getMemberCount: () => {
        return get().members.length;
      },
    }),
    {
      name: 'family-storage',
      storage: createJSONStorage(() => secureStorage),
      // Only persist members, not loading state
      partialize: (state: FamilyState) => ({ members: state.members }),
    }
  )
);

