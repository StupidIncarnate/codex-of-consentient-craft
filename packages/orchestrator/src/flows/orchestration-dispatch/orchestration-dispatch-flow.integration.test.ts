import { BaseNameStub } from '@dungeonmaster/testing';
import { DispatchHoldStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatcherHarness } from '../../../test/harnesses/rate-limits-watcher/rate-limits-watcher.harness';
import { RateLimitsFlow } from '../rate-limits/rate-limits-flow';

import { OrchestrationDispatchFlow } from './orchestration-dispatch-flow';

const TEST_TIMEOUT_MS = 20000;
const HOUR_MS = 3_600_000;
const TWO_HOURS_MS = 7_200_000;
const FIVE_MINUTES_MS = 300_000;
const NO_SPEND = 0;

describe('OrchestrationDispatchFlow', () => {
  describe('bootstrap', () => {
    it('VALID: {first call} => returns success', () => {
      // Point the home at a nonexistent dir so boot normalization reads the paused default
      // and never touches the developer's real ~/.dungeonmaster.
      process.env.DUNGEONMASTER_HOME = '/tmp/dm-dispatch-flow-integration-nonexistent';

      const result = OrchestrationDispatchFlow.bootstrap();

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {second call} => idempotent, returns success', () => {
      process.env.DUNGEONMASTER_HOME = '/tmp/dm-dispatch-flow-integration-nonexistent';
      OrchestrationDispatchFlow.bootstrap();

      const result = OrchestrationDispatchFlow.bootstrap();

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('get', () => {
    it('VALID: {missing state file} => resolves the paused default', async () => {
      process.env.DUNGEONMASTER_HOME = '/tmp/dm-dispatch-flow-integration-nonexistent';

      const state = await OrchestrationDispatchFlow.get();

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(state).toStrictEqual({
        mode: 'paused',
        updatedAt: '1970-01-01T00:00:00.000Z',
      });
    });
  });

  // `mode` is the user's lever and `hold` is the rate-limit guardrail's, and play/pause is where
  // the two meet: each writes ONE of them and forwards the other untouched.
  describe('play and pause against a live rate-limit hold', () => {
    const harness = rateLimitsWatcherHarness();

    beforeEach(() => {
      // Clears the in-memory mirror AND the wake subscription the bootstrap tests above left on it,
      // so pressing play here never kicks the Node dispatch runner into a temp home.
      harness.resetWatcher();
      harness.resetDispatchState();
    });

    it(
      'VALID: {user presses play while a hold stands} => dispatch-state.json carries node-playing AND the hold, and getIsPlaying() is still false',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-play' }) });
        const nowMs = Date.now();
        const standingHold = DispatchHoldStub({
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 93% — dispatch holds until it resets',
          heldAt: new Date(nowMs - HOUR_MS).toISOString(),
          resumeAt: new Date(nowMs + HOUR_MS).toISOString(),
        });
        await harness.seedDispatch({ tempDir, mode: 'paused', hold: standingHold });

        const played = await OrchestrationDispatchFlow.play({});
        const persisted = harness.readDispatch({ tempDir });
        const isPlaying = harness.getIsPlaying();
        const isPlayRequested = harness.getIsPlayRequested();

        await end();

        expect({
          playAllowed: played.allowed,
          mode: persisted.mode,
          hold: persisted.hold,
          isPlaying,
          isPlayRequested,
        }).toStrictEqual({
          playAllowed: true,
          mode: 'node-playing',
          hold: standingHold,
          isPlaying: false,
          isPlayRequested: true,
        });
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'VALID: {user pauses while a hold stands, then the hold expires} => getIsPlaying() stays false because the user never asked to play',
      async () => {
        const { tempDir, end } = harness.begin({ name: BaseNameStub({ value: 'rl-pause' }) });
        const nowMs = Date.now();
        const hourAt = nowMs - (nowMs % HOUR_MS) - TWO_HOURS_MS;
        // Nothing calibrated and nothing spent, so the only thing the guardrail pass after the
        // pause can do is lift the hold — which is the half of this test it owns.
        await harness.seedLedger({
          tempDir,
          fiveHour: null,
          sevenDay: null,
          hourAt,
          tokens: NO_SPEND,
        });
        const standingHold = DispatchHoldStub({
          reason: 'approaching-limit',
          window: 'seven-day',
          detail: '7d window at 93% — dispatch holds until it resets',
          heldAt: new Date(nowMs - HOUR_MS).toISOString(),
          resumeAt: new Date(nowMs - FIVE_MINUTES_MS).toISOString(),
        });
        await harness.seedDispatch({ tempDir, mode: 'paused', hold: standingHold });

        await OrchestrationDispatchFlow.play({});
        const pausedState = await OrchestrationDispatchFlow.pause();
        RateLimitsFlow.bootstrap();
        await harness.awaitHoldCleared({ tempDir });

        const persisted = harness.readDispatch({ tempDir });
        const isPlaying = harness.getIsPlaying();
        const isPlayRequested = harness.getIsPlayRequested();

        await end();

        expect({
          holdSurvivedThePause: pausedState.hold,
          mode: persisted.mode,
          hold: persisted.hold,
          isPlaying,
          isPlayRequested,
        }).toStrictEqual({
          holdSurvivedThePause: standingHold,
          mode: 'paused',
          hold: null,
          isPlaying: false,
          isPlayRequested: false,
        });
      },
      TEST_TIMEOUT_MS,
    );
  });
});
