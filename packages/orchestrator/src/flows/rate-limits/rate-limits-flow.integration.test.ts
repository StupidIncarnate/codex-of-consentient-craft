import { BaseNameStub } from '@dungeonmaster/testing';
import { DispatchHoldStub, RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatcherHarness } from '../../../test/harnesses/rate-limits-watcher/rate-limits-watcher.harness';
import { OrchestrationDispatchFlow } from '../orchestration-dispatch/orchestration-dispatch-flow';
import { QuestFlow } from '../quest/quest-flow';

import { RateLimitsFlow } from './rate-limits-flow';

const TEST_TIMEOUT_MS = 20000;

const HOUR_MS = 3_600_000;
const TWO_HOURS_MS = 7_200_000;
const TEN_HOURS_MS = 36_000_000;
const FIVE_MINUTES_MS = 300_000;
const SEVEN_DAY_MS = 604_800_000;

// The learned denominator. Every spend below is written as input tokens, whose weight is 1, so the
// weighted total the guardrail divides by this ceiling is exactly the number the test wrote.
const QUOTA = 1_000_000;
const SPEND_90 = 900_000;
const SPEND_89 = 890_000;
const SPEND_95 = 950_000;
const SPEND_10 = 100_000;
const SPEND_HUGE = 10_000_000;

const DETAIL_90 = '7d window at 90% — dispatch holds until it resets';
const DETAIL_95 = '7d window at 95% — dispatch holds until it resets';
// The rate-limits.json poller's own identity on the bus, as against 'rate-limits-measure', which is
// what the guardrail's ledger reading publishes under.
const WATCHER_PROCESS_ID = 'rate-limits-watcher';

describe('RateLimitsFlow', () => {
  const harness = rateLimitsWatcherHarness();

  beforeEach(() => {
    // A test that throws before its own teardown would otherwise leave the watcher handle set, and
    // RateLimitsBootstrapResponder is idempotent — the next test's bootstrap() would be a no-op
    // against a dead home, turning one red into a cascade.
    harness.resetWatcher();
    harness.resetDispatchState();
  });

  it(
    'VALID: {snapshot file present at bootstrap} => its content is never published, because the ledger is the only source',
    async () => {
      const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-watch' }) });
      await harness.writeSnapshot({ tempDir, snapshot: RateLimitsSnapshotStub() });

      const collector = harness.collectRateLimitsUpdated();

      RateLimitsFlow.bootstrap();

      await harness.awaitQuiet();
      const watcherEvents = collector.eventsFrom({ processId: WATCHER_PROCESS_ID });

      await end();

      // The statusline pipeline that wrote this file records a reading only while a user has a
      // session open, so a queue running unattended has none — which is the case the guardrail
      // exists for. The measurement comes from the usage ledger instead, and this file's snapshot
      // is not a second opinion: a second publisher overwrote the ledger reading on every tick and
      // whichever fired last won.
      expect(watcherEvents).toStrictEqual([]);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'ERROR: {malformed JSON in snapshot file} => state stays null and parse error is logged to stderr without firing rate-limits-updated event',
    async () => {
      const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-bad-json' }) });
      await harness.writeRaw({ tempDir, content: 'not json at all' });

      const handler = jest.fn();
      const subscription = harness.subscribeRateLimitsUpdated({ handler });
      const stderr = harness.captureStderr();

      RateLimitsFlow.bootstrap();

      await harness.pollUntil({
        condition: () =>
          stderr.hasLineWithSubstring({ substring: 'rate-limits-watch parse error:' }),
      });
      await harness.awaitQuiet();

      stderr.restore();
      const finalState = harness.getStateSnapshot();
      const finalCalls = handler.mock.calls.length;
      const errorLogged = stderr.hasLineWithSubstring({
        substring: 'rate-limits-watch parse error:',
      });

      subscription.removeAll();
      await end();

      expect(finalState).toBe(null);
      expect(finalCalls).toBe(0);
      expect(errorLogged).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'EMPTY: {file never present} => state stays null and no rate-limits-updated events fire across at least one poll cycle',
    async () => {
      const { end } = harness.begin({ name: BaseNameStub({ value: 'rl-no-file' }) });

      const handler = jest.fn();
      const subscription = harness.subscribeRateLimitsUpdated({ handler });

      RateLimitsFlow.bootstrap();

      await harness.awaitQuiet();
      const finalState = harness.getStateSnapshot();
      const finalCalls = handler.mock.calls.length;

      subscription.removeAll();
      await end();

      expect(finalState).toBe(null);
      expect(finalCalls).toBe(0);
    },
    TEST_TIMEOUT_MS,
  );

  describe('the guardrail pauses the queue', () => {
    it(
      'VALID: {seven-day spend at 90% of a calibrated seven-day ceiling} => dispatch-state.json carries an approaching-limit hold on seven-day and getIsPlaying() is false while mode stays node-playing',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-raise' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        await harness.seedLedger({
          tempDir,
          fiveHour: null,
          sevenDay: QUOTA,
          hourAt,
          tokens: SPEND_90,
        });
        await harness.seedDispatch({ tempDir, mode: 'paused' });

        const played = await OrchestrationDispatchFlow.play({});
        const playedAtMs = Date.now();
        RateLimitsFlow.bootstrap();
        await harness.awaitHoldDetail({ tempDir, detail: DETAIL_90 });

        const persisted = harness.readDispatch({ tempDir });
        const isPlaying = harness.getIsPlaying();
        const isPlayRequested = harness.getIsPlayRequested();
        const heldAtMs = Date.parse(String(persisted.hold?.heldAt));

        await end();

        expect({
          playAllowed: played.allowed,
          mode: persisted.mode,
          reason: persisted.hold?.reason,
          window: persisted.hold?.window,
          detail: persisted.hold?.detail,
          resumeAt: persisted.hold?.resumeAt,
          isPlaying,
          isPlayRequested,
        }).toStrictEqual({
          playAllowed: true,
          mode: 'node-playing',
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 90% — dispatch holds until it resets',
          resumeAt: new Date(hourAt + SEVEN_DAY_MS + HOUR_MS).toISOString(),
          isPlaying: false,
          isPlayRequested: true,
        });
        expect(heldAtMs).toBeGreaterThanOrEqual(playedAtMs);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'EDGE: {seven-day spend at 89% of the same ceiling} => no hold is ever written and getIsPlaying() stays true',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-under' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        await harness.seedLedger({
          tempDir,
          fiveHour: null,
          sevenDay: QUOTA,
          hourAt,
          tokens: SPEND_89,
        });
        await harness.seedDispatch({ tempDir, mode: 'paused' });

        await OrchestrationDispatchFlow.play({});
        RateLimitsFlow.bootstrap();
        await harness.awaitQuiet();

        const persisted = harness.readDispatch({ tempDir });
        const isPlaying = harness.getIsPlaying();

        await end();

        expect({ mode: persisted.mode, hold: persisted.hold, isPlaying }).toStrictEqual({
          mode: 'node-playing',
          hold: undefined,
          isPlaying: true,
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'EDGE: {spend measured but both ceilings null} => no hold is raised at any spend level',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-uncal' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        // Ten times what every other test here calls a full quota. With nothing calibrated there is
        // no denominator, so there is no percentage and no hold at any spend at all.
        await harness.seedLedger({
          tempDir,
          fiveHour: null,
          sevenDay: null,
          hourAt,
          tokens: SPEND_HUGE,
        });
        await harness.seedDispatch({ tempDir, mode: 'paused' });

        await OrchestrationDispatchFlow.play({});
        RateLimitsFlow.bootstrap();
        await harness.awaitQuiet();

        const persisted = harness.readDispatch({ tempDir });
        const isPlaying = harness.getIsPlaying();

        await end();

        expect({ mode: persisted.mode, hold: persisted.hold, isPlaying }).toStrictEqual({
          mode: 'node-playing',
          hold: undefined,
          isPlaying: true,
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'EDGE: {both windows over the threshold} => the persisted hold names seven-day, whose later reset clears both',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-both' }) });
        const nowMs = Date.now();
        // Two hours old, so this one hour of spend sits inside BOTH windows, at 95% of each.
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        await harness.seedLedger({
          tempDir,
          fiveHour: QUOTA,
          sevenDay: QUOTA,
          hourAt,
          tokens: SPEND_95,
        });
        await harness.seedDispatch({ tempDir, mode: 'node-playing' });

        RateLimitsFlow.bootstrap();
        await harness.awaitHoldDetail({ tempDir, detail: DETAIL_95 });

        const persisted = harness.readDispatch({ tempDir });

        await end();

        // The five-hour window is over the line too, and its own reset is four hours after that
        // hour. The resume time below is seven days after it, which is the wait that clears both.
        expect({
          reason: persisted.hold?.reason,
          window: persisted.hold?.window,
          detail: persisted.hold?.detail,
          resumeAt: persisted.hold?.resumeAt,
        }).toStrictEqual({
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 95% — dispatch holds until it resets',
          resumeAt: new Date(hourAt + SEVEN_DAY_MS + HOUR_MS).toISOString(),
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'VALID: {a hold standing and get-next-step polled} => returns idle naming the window and the resume time, and writes no mcp heartbeat',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-idle' }) });
        await harness.seedDispatch({
          tempDir,
          mode: 'paused',
          hold: DispatchHoldStub({
            reason: 'approaching-limit',
            window: 'seven-day',
            detail: '7d window at 93% — dispatch holds until it resets',
            heldAt: '2026-09-13T04:49:29.242Z',
            resumeAt: '2099-01-01T00:00:00.000Z',
          }),
        });

        const step = await QuestFlow.getNextStep();
        const persisted = harness.readDispatch({ tempDir });

        await end();

        expect({ step, mcpHeartbeatAt: persisted.mcpHeartbeatAt }).toStrictEqual({
          step: {
            type: 'idle',
            reason:
              'rate-limit guardrail: 7d window at 93% — dispatch holds until it resets. Dispatch resumes at 2099-01-01T00:00:00.000Z.',
          },
          mcpHeartbeatAt: undefined,
        });
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('the guardrail resumes the queue on its own', () => {
    it(
      'VALID: {five-hour hold past its resumeAt with the spend aged out of the five-hour window} => the next pass clears the hold on disk and getIsPlaying() returns true',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-lift' }) });
        const nowMs = Date.now();
        // Ten hours old: still inside the seven-day window, already outside the five-hour one, so
        // the five-hour reading this pass takes is zero.
        const hourAt = nowMs - (nowMs % HOUR_MS) - TEN_HOURS_MS;
        await harness.seedLedger({
          tempDir,
          fiveHour: QUOTA,
          sevenDay: null,
          hourAt,
          tokens: SPEND_95,
        });
        await harness.seedDispatch({
          tempDir,
          mode: 'paused',
          hold: DispatchHoldStub({
            reason: 'approaching-limit',
            window: 'five-hour',
            detail: '5h window at 95% — dispatch holds until it resets',
            heldAt: new Date(nowMs - HOUR_MS).toISOString(),
            resumeAt: new Date(nowMs - FIVE_MINUTES_MS).toISOString(),
          }),
        });

        await OrchestrationDispatchFlow.play({});
        RateLimitsFlow.bootstrap();
        await harness.awaitHoldCleared({ tempDir });

        const persisted = harness.readDispatch({ tempDir });
        const isPlaying = harness.getIsPlaying();

        await end();

        expect({ mode: persisted.mode, hold: persisted.hold, isPlaying }).toStrictEqual({
          mode: 'node-playing',
          hold: null,
          isPlaying: true,
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'VALID: {seven-day hold past its resumeAt while the spend is still over the threshold} => the hold is re-raised off the fresh reading rather than left clear',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-rehold' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        await harness.seedLedger({
          tempDir,
          fiveHour: null,
          sevenDay: QUOTA,
          hourAt,
          tokens: SPEND_95,
        });
        await harness.seedDispatch({
          tempDir,
          mode: 'node-playing',
          hold: DispatchHoldStub({
            reason: 'approaching-limit',
            window: 'seven-day',
            detail: '7d window at 91% — dispatch holds until it resets',
            heldAt: new Date(nowMs - HOUR_MS).toISOString(),
            resumeAt: new Date(nowMs - FIVE_MINUTES_MS).toISOString(),
          }),
        });

        RateLimitsFlow.bootstrap();
        await harness.awaitHoldDetail({ tempDir, detail: DETAIL_95 });

        const persisted = harness.readDispatch({ tempDir });

        await end();

        expect({
          reason: persisted.hold?.reason,
          window: persisted.hold?.window,
          detail: persisted.hold?.detail,
          resumeAt: persisted.hold?.resumeAt,
        }).toStrictEqual({
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 95% — dispatch holds until it resets',
          resumeAt: new Date(hourAt + SEVEN_DAY_MS + HOUR_MS).toISOString(),
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'VALID: {rejected hold past its thirty-minute wait while the window is still spent} => re-holds as approaching-limit off the fresh reading',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-429' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        await harness.seedLedger({
          tempDir,
          fiveHour: null,
          sevenDay: QUOTA,
          hourAt,
          tokens: SPEND_95,
        });
        // A 429 hold carries no reading behind it — its resumeAt is a flat thirty-minute wait, and
        // what happens when that wait runs out is the whole question here.
        await harness.seedDispatch({
          tempDir,
          mode: 'node-playing',
          hold: DispatchHoldStub({
            reason: 'rejected',
            window: 'seven-day',
            detail: 'the API refused a request on the 7d window — dispatch holds, then retries',
            heldAt: new Date(nowMs - HOUR_MS).toISOString(),
            resumeAt: new Date(nowMs - FIVE_MINUTES_MS).toISOString(),
          }),
        });

        RateLimitsFlow.bootstrap();
        await harness.awaitHoldDetail({ tempDir, detail: DETAIL_95 });

        const persisted = harness.readDispatch({ tempDir });

        await end();

        expect({
          reason: persisted.hold?.reason,
          window: persisted.hold?.window,
          detail: persisted.hold?.detail,
          resumeAt: persisted.hold?.resumeAt,
        }).toStrictEqual({
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 95% — dispatch holds until it resets',
          resumeAt: new Date(hourAt + SEVEN_DAY_MS + HOUR_MS).toISOString(),
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'EDGE: {hold not yet expired while the current reading has dipped under the threshold} => the persisted hold is left exactly as it stands',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-standing' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        await harness.seedLedger({
          tempDir,
          fiveHour: null,
          sevenDay: QUOTA,
          hourAt,
          tokens: SPEND_10,
        });
        const standingHold = DispatchHoldStub({
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 99% — dispatch holds until it resets',
          heldAt: new Date(nowMs - HOUR_MS).toISOString(),
          resumeAt: new Date(nowMs + HOUR_MS).toISOString(),
        });
        await harness.seedDispatch({ tempDir, mode: 'node-playing', hold: standingHold });

        const before = harness.readDispatch({ tempDir });

        RateLimitsFlow.bootstrap();
        await harness.awaitQuiet();

        const persisted = harness.readDispatch({ tempDir });

        await end();

        // updatedAt is the one field a rewrite always moves, so carrying the pre-bootstrap value
        // into the expectation is what proves twenty poll cycles wrote nothing at all.
        expect(persisted).toStrictEqual({
          mode: 'node-playing',
          hold: standingHold,
          mcpHeartbeatAt: undefined,
          updatedAt: before.updatedAt,
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'VALID: {spend inside the seven-day window but outside the five-hour one} => the five-hour window recovers while the seven-day one does not',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-split' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TEN_HOURS_MS;
        // BOTH windows are calibrated, so a five-hour breach would be visible if there were one.
        await harness.seedLedger({
          tempDir,
          fiveHour: QUOTA,
          sevenDay: QUOTA,
          hourAt,
          tokens: SPEND_95,
        });
        await harness.seedDispatch({ tempDir, mode: 'node-playing' });

        RateLimitsFlow.bootstrap();
        await harness.awaitHoldDetail({ tempDir, detail: DETAIL_95 });

        const persisted = harness.readDispatch({ tempDir });

        await end();

        // The resume time is that one spent hour plus a whole seven-day window. The seven-day
        // window is tested first, so naming it is only reachable when it is the one over the line —
        // and the five-hour window holding the same hour of spend cleared hours ago.
        expect({
          window: persisted.hold?.window,
          detail: persisted.hold?.detail,
          resumeAt: persisted.hold?.resumeAt,
        }).toStrictEqual({
          window: 'seven-day',
          detail: '7d window at 95% — dispatch holds until it resets',
          resumeAt: new Date(hourAt + SEVEN_DAY_MS + HOUR_MS).toISOString(),
        });
      },
      TEST_TIMEOUT_MS,
    );
  });
});
