# State Stores

This directory contains Zustand stores for state management.

## Files

- `familyStore.ts` - Family members state management
- `calendarStore.ts` - Calendar events state management
- `index.ts` - Central export file

## Implementation

The app uses **Zustand** for state management with **SecureStore** for persistence.

### Usage

```typescript
import { useFamilyStore, useCalendarStore } from '@/stores';

const members = useFamilyStore((state) => state.members);
const addMember = useFamilyStore((state) => state.addMember);

const { members, isLoading } = useFamilyStore((state) => ({
  members: state.members,
  isLoading: state.isLoading,
}));
```

## Benefits

- Better performance (fewer re-renders)
- Devtools support (can add Zustand devtools)
- Less boilerplate than Context API
- Easier to test
- Better TypeScript inference
- Automatic persistence with SecureStore

## Migration Complete

The app has been migrated from Context API to Zustand:
- Family state moved to `familyStore.ts`
- Calendar state moved to `calendarStore.ts`
- All components updated to use store hooks
- Context providers removed from `app/_layout.tsx`
- SecureStore persistence maintained
