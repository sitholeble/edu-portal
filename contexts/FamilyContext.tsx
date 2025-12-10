import * as SecureStore from 'expo-secure-store';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

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

interface FamilyContextType {
  familyMembers: FamilyMember[];
  isLoading: boolean;
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  getFamilyMember: (id: string) => FamilyMember | undefined;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

const FAMILY_MEMBERS_KEY = 'family_members';

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const stored = await SecureStore.getItemAsync(FAMILY_MEMBERS_KEY);
      if (stored) {
        setFamilyMembers(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFamilyMembers = async (members: FamilyMember[]) => {
    try {
      await SecureStore.setItemAsync(FAMILY_MEMBERS_KEY, JSON.stringify(members));
      setFamilyMembers(members);
    } catch (error) {
      console.error('Error saving family members:', error);
      throw error;
    }
  };

  const addFamilyMember = async (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newMember: FamilyMember = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...familyMembers, newMember];
    await saveFamilyMembers(updated);
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    const updated = familyMembers.map((member) =>
      member.id === id
        ? { ...member, ...updates, updatedAt: new Date().toISOString() }
        : member
    );
    await saveFamilyMembers(updated);
  };

  const deleteFamilyMember = async (id: string) => {
    const updated = familyMembers.filter((member) => member.id !== id);
    await saveFamilyMembers(updated);
  };

  const getFamilyMember = (id: string) => {
    return familyMembers.find((member) => member.id === id);
  };

  return (
    <FamilyContext.Provider
      value={{
        familyMembers,
        isLoading,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        getFamilyMember,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}

