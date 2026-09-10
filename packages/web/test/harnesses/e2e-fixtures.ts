/**
 * PURPOSE: Extends Playwright test with the auto-fixtures every test gets with no opt-in — an
 *          open-handle watch, network recording, and a Node-dispatcher pause on each side of the
 *          test — and provides wireHarnessLifecycle for bridging harness hooks to Playwright.
 *          Declaration order IS teardown order reversed, so it is load-bearing; see the watch.
 *
 * USAGE:
 * import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
 * // The watch, network recording and the dispatcher pause run automatically — no setup needed
 * // wireHarnessLifecycle bridges harness beforeEach/afterEach to Playwright's test hooks
 */
import { test as base, expect } from '@playwright/test';
import { dispatchPauseHarness } from './dispatch-pause/dispatch-pause.harness';
import { networkHarness } from './network/network.harness';
import { openHandleWatchHarness } from './open-handle-watch/open-handle-watch.harness';

interface AutoFixtures {
  _networkRecording: undefined;
  _dispatcherPaused: undefined;
  _openHandleWatch: undefined;
}

export const test = base.extend<AutoFixtures>({
  // Playwright is a THIRD process layer with its own leak surface, and neither of ward's other two
  // detections reaches it: jest's `--detectOpenHandles` never runs here, and the timer watch ward
  // arms for a jest worker is armed in a jest worker. A spec or a harness that leaves an interval
  // behind therefore leaked silently, however green the run.
  //
  // Off unless ward asks — the harness answers to the same
  // DUNGEONMASTER_OPEN_HANDLE_REPORT the jest side reads, and a run without it patches nothing.
  //
  // DECLARED FIRST so it tears down LAST, because Playwright tears fixtures down in the reverse of
  // their setup order and a watch has to outlive what it watches. Reporting before the fixtures
  // below have torn down samples the wrong window twice over: the network recorder's own body reads
  // are still in flight, and `openHandleReportBroker` clears its list as it reports, so anything the
  // later teardowns arm is handed to whichever test reports NEXT.
  _openHandleWatch: [
    async ({ request: _request }, use, testInfo) => {
      const harness = openHandleWatchHarness();
      harness.beforeEach();
      await use(undefined);
      harness.report({ testPath: testInfo.file });
    },
    { auto: true },
  ],

  _networkRecording: [
    async ({ page }, use, testInfo) => {
      const harness = networkHarness({ page });
      harness.beforeEach();
      await use(undefined);
      await harness.dump({ testInfo });
    },
    { auto: true },
  ],

  // The dispatcher is ONE in-memory singleton for the whole run — `workers: 1`,
  // `fullyParallel: false`, every spec against one long-lived server — and two ordinary user
  // actions start it: `QuestStartResponder` and `QuestResumeResponder` both play it. So clicking
  // Begin Quest or RESUME leaves a background loop running, and that loop then eats the NEXT
  // spec's queued mock responses and drives its fixtures.
  //
  // It belongs here rather than on a harness because the spec that starts the loop need never
  // import one: a spec author with no idea the dispatcher exists still leaks it. An auto-fixture
  // makes "no spec runs against a loop somebody else started" a property of the suite instead of
  // something each author remembers.
  //
  // BOTH sides are load-bearing, and they buy different things. Playwright sets test-scoped
  // fixtures up before any `beforeEach` hook and tears them down after every `afterEach` hook, so
  // the SETUP pause protects the spec about to run whatever the previous one did — including a
  // spec whose only defence is `holdQueueWithMcpHeartbeat`, which refuses every future play but
  // cannot stop a loop already running. The TEARDOWN pause stops that loop chewing on a guild
  // directory during the gap between specs.
  //
  // Guarded by `src/flows/app/dispatch-pause-between-specs.e2e.ts`, which stages the leak in one
  // test and measures the state the next one inherits.
  _dispatcherPaused: [
    async ({ request }, use) => {
      const harness = dispatchPauseHarness({ request });
      await harness.pause();
      await use(undefined);
      await harness.pause();
    },
    { auto: true },
  ],
});

export { expect };

type HarnessWithLifecycle = Record<PropertyKey, unknown> & {
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
};

interface PlaywrightTestObj {
  beforeEach: (fn: () => void | Promise<void>) => void;
  afterEach: (fn: () => void | Promise<void>) => void;
}

export const wireHarnessLifecycle = <T extends HarnessWithLifecycle>({
  harness,
  testObj,
}: {
  harness: T;
  testObj: PlaywrightTestObj;
}): T => {
  if (typeof harness.beforeEach === 'function') {
    testObj.beforeEach(harness.beforeEach);
  }

  if (typeof harness.afterEach === 'function') {
    testObj.afterEach(harness.afterEach);
  }

  return harness;
};
