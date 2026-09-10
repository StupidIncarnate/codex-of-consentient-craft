// Global Jest setup for consistent test environment

// Ward hands the jest process `--conditions=source` through NODE_OPTIONS, which is what makes the
// transform glue's own `@dungeonmaster/*` imports resolve to source (see check-run-unit-broker).
// NODE_OPTIONS is INHERITED, so without this every process a TEST spawns gets it too — and a
// compiled child (a built hook binary, a bundled CLI) then resolves `@dungeonmaster/shared/statics`
// to a `.ts` file it cannot require, and dies with no output. Measured: 7 SessionStart hooks all
// returning error attachments, and 6 tooling/cli integration tests reporting exit 1 with an empty
// stdout.
//
// Deleting the variable here does NOT weaken this process: Node parses NODE_OPTIONS once at
// startup, so the condition stays applied to every resolution the worker makes afterwards. It only
// stops the value being copied into children. Jest forks its workers from the MAIN process env,
// which is untouched, so a restarted worker still starts with the flag.
if (typeof process.env.NODE_OPTIONS === 'string') {
  const withoutSourceCondition = process.env.NODE_OPTIONS.replace(
    /(?:^|\s)--conditions=source(?=\s|$)/gu,
    ' ',
  ).trim();

  if (withoutSourceCondition === '') {
    delete process.env.NODE_OPTIONS;
  } else {
    process.env.NODE_OPTIONS = withoutSourceCondition;
  }
}

// Wire harness lifecycle hooks — called by the harness-lifecycle-transformer
// when it wraps *Harness() calls in integration test files
globalThis.__wireHarnessLifecycle = (harness) => {
  if (harness && typeof harness === 'object') {
    if (typeof harness.beforeEach === 'function') {
      beforeEach(harness.beforeEach);
    }
    if (typeof harness.afterEach === 'function') {
      afterEach(harness.afterEach);
    }
  }
  return harness;
};

// Detect .todo and .skip usage and fail immediately
const originalDescribe = global.describe;
const originalIt = global.it;
const originalTest = global.test;

const forbiddenMethodChecker = (testMethod, methodName) =>
  new Proxy(testMethod, {
    get(target, property) {
      if (property === 'todo' || property === 'skip') {
        throw new Error(
          `${methodName}.${property}() is forbidden. All tests must be complete and runnable. Remove .${property} and implement the test.`,
        );
      }
      return target[property];
    },
  });

global.describe = forbiddenMethodChecker(originalDescribe, 'describe');
global.it = forbiddenMethodChecker(originalIt, 'it');
global.test = forbiddenMethodChecker(originalTest, 'test');

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

// Required HERE, at setup-file scope, and NOT inside the afterEach below. Jest measures a test from
// `test_start` to `test_done`, which brackets beforeEach and afterEach — so a require inside the
// hook charges this graph's COMPILE to whichever test ran first in a worker. Measured on a cold
// cache: 4.4s of "test time" against 0.1s of real assertions, on a different suite every run, and
// the worst inflation across 176 mcp suites went 9.2s -> 0.0s when it moved here.
// Setup-file scope is still inside jest's runtime, so the extensionless specifier still resolves
// through moduleFileExtensions to the .ts source with no loader.
const {
  integrationEnvironmentCleanupAllBroker,
} = require('./brokers/integration-environment/cleanup-all/integration-environment-cleanup-all-broker');

// Ward names a file here when it wants open handles reported. Unset means nobody asked, and none of
// the tracking below is even loaded — so an ordinary run pays nothing for it.
const openHandleReportPath = process.env.DUNGEONMASTER_OPEN_HANDLE_REPORT;

if (openHandleReportPath) {
  const {
    openHandleTrackingBroker,
  } = require('./brokers/open-handle/tracking/open-handle-tracking-broker');
  const { openHandleReportBroker } = require('./brokers/open-handle/report/open-handle-report-broker');

  openHandleTrackingBroker.watch();

  // afterAll, not afterEach: a timer armed in one test and cleared in a later one is not a leak, and
  // jest runs afterAll OUTSIDE the test_start..test_done window, so this costs no test time either.
  afterAll(() => {
    openHandleReportBroker({
      testPath: expect.getState().testPath || '',
      reportPath: openHandleReportPath,
    });
  });
}

afterEach(() => {
  // Clean up all integration test environments. Deliberately unguarded: a catch here turns a
  // missing module into silently skipped cleanup, which is indistinguishable from cleanup that ran.
  integrationEnvironmentCleanupAllBroker();

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
