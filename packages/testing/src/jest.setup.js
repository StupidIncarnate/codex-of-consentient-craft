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

  // Check for empty tests (tests without assertions)
  const currentTest = expect.getState().currentTestName;
  const assertionsMade = expect.getState().assertionCalls;

  // Skip assertion check for ESLint RuleTester integration tests
  // RuleTester.run() creates its own assertions internally
  const testPath = expect.getState().testPath || '';
  const isRuleTesterTest = testPath.includes('RuleTester') || global.RuleTester !== undefined;

  if (assertionsMade === 0 && !isRuleTesterTest) {
    throw new Error(
      `Test "${currentTest}" has no assertions. Add expect() calls or remove the test.`,
    );
  }
});
