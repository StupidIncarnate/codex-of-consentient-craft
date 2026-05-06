import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { ElapsedMsStub } from '../../contracts/elapsed-ms/elapsed-ms.stub';
import { rateLimitsWatcherHarness } from '../../../test/harnesses/rate-limits-watcher/rate-limits-watcher.harness';

import { RateLimitsFlow } from './rate-limits-flow';

const TICK_TIMEOUT = ElapsedMsStub({ value: 8000 });
const SETTLE_DELAY = ElapsedMsStub({ value: 200 });
const TEST_TIMEOUT_MS = 20000;

describe('RateLimitsFlow', () => {
  const harness = rateLimitsWatcherHarness();

  it(
    'VALID: {snapshot file present at bootstrap} => state populates from disk and rate-limits-updated event fires once with the snapshot payload',
    async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rate-limits-flow-write' }),
      });
      const env = harness.setupHome({ tempDir: testbed.guildPath });
      const snapshot = RateLimitsSnapshotStub();
      harness.writeSnapshot({ tempDir: testbed.guildPath, snapshot });

      const handler = jest.fn();
      const subscription = harness.subscribeRateLimitsUpdated({ handler });

      RateLimitsFlow.bootstrap();

      await harness.pollUntil({
        condition: () => harness.getStateSnapshot() !== null,
        timeoutMs: TICK_TIMEOUT,
      });
      const finalState = harness.getStateSnapshot();
      const finalCalls = handler.mock.calls.length;

      subscription.removeAll();
      harness.resetWatcher();
      env.restore();
      testbed.cleanup();

      expect(finalState).toStrictEqual(snapshot);
      expect(finalCalls).toBe(1);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'ERROR: {malformed JSON in snapshot file} => state stays null and parse error is logged to stderr without firing rate-limits-updated event',
    async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rate-limits-flow-malformed' }),
      });
      const env = harness.setupHome({ tempDir: testbed.guildPath });
      harness.writeRaw({ tempDir: testbed.guildPath, content: 'not json at all' });

      const handler = jest.fn();
      const subscription = harness.subscribeRateLimitsUpdated({ handler });
      const stderr = harness.captureStderr();

      RateLimitsFlow.bootstrap();

      await harness.pollUntil({
        condition: () =>
          stderr.hasLineWithSubstring({ substring: 'rate-limits-watch parse error:' }),
        timeoutMs: TICK_TIMEOUT,
      });
      await harness.delayMs({ ms: SETTLE_DELAY });

      stderr.restore();
      const finalState = harness.getStateSnapshot();
      const finalCalls = handler.mock.calls.length;
      const errorLogged = stderr.hasLineWithSubstring({
        substring: 'rate-limits-watch parse error:',
      });

      subscription.removeAll();
      harness.resetWatcher();
      env.restore();
      testbed.cleanup();

      expect(finalState).toBe(null);
      expect(finalCalls).toBe(0);
      expect(errorLogged).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'EMPTY: {file never present} => state stays null and no rate-limits-updated events fire across at least one poll cycle',
    async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rate-limits-flow-empty' }),
      });
      const env = harness.setupHome({ tempDir: testbed.guildPath });

      const handler = jest.fn();
      const subscription = harness.subscribeRateLimitsUpdated({ handler });

      RateLimitsFlow.bootstrap();

      await harness.delayMs({ ms: TICK_TIMEOUT });
      const finalState = harness.getStateSnapshot();
      const finalCalls = handler.mock.calls.length;

      subscription.removeAll();
      harness.resetWatcher();
      env.restore();
      testbed.cleanup();

      expect(finalState).toBe(null);
      expect(finalCalls).toBe(0);
    },
    TEST_TIMEOUT_MS,
  );
});
