// Mock Expo SecureStore
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn((key) => {
      return Promise.resolve(store.get(key) || null);
    }),
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
    // Helper to clear store between tests
    __clearStore: () => store.clear(),
  };
});

