// Global Jest setup for consistent test environment

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

afterEach(() => {
  // Restore real timers after each test
  jest.useRealTimers();
});