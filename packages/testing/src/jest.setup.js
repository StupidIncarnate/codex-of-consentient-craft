// Global Jest setup for consistent test environment

// Detect .todo and .skip usage and fail immediately
const originalDescribe = global.describe;
const originalIt = global.it;
const originalTest = global.test;

const forbiddenMethodChecker = (testMethod, methodName) => {
  return new Proxy(testMethod, {
    get(target, property) {
      if (property === 'todo' || property === 'skip') {
        throw new Error(
          `${methodName}.${property}() is forbidden. All tests must be complete and runnable. Remove .${property} and implement the test.`,
        );
      }
      return target[property];
    },
  });
};

global.describe = forbiddenMethodChecker(originalDescribe, 'describe');
global.it = forbiddenMethodChecker(originalIt, 'it');
global.test = forbiddenMethodChecker(originalTest, 'test');

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
