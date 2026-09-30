import { z } from '#gateway/npm/zod';
import type { Guild } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { isNativeErrorProxy } from '#gateway/node/util__types/is-native-error/is-native-error.proxy';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { stepDispatchBrokerProxy } from '../../step/dispatch/step-dispatch-broker.proxy';

// Re-declared locally rather than imported: browser-session-contract.ts keeps its own parsing
// contract private, the same reason step-dispatch-broker.proxy.ts re-declares matchCountContract.
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const ZERO_MATCH_COUNT = 0;

// stepDispatchBrokerProxy() itself stages Date.now to a fixed value (1_700_000_000_000) — this
// proxy relies on that staging rather than repeating it, since a second registerSpyOn on the same
// global would only collide with an identical value. A test asserting startedAtMs/endedAtMs
// hardcodes that same literal, the same way step-dispatch-broker.test.ts does.
export const runExecuteStepLayerBrokerProxy = (): {
  laneGotoSucceeds: () => LaneSession;
  laneGotoRejects: (params: { error: Error }) => LaneSession;
  laneGotoRejectsAndCaptureFails: (params: { error: Error; captureError: Error }) => LaneSession;
  laneGotoRejectsWithServerLogWindow: (params: {
    error: Error;
    serverLogLengthSequence: readonly number[];
  }) => LaneSession;
  laneWaitForHitsCeiling: (params: { error: Error }) => LaneSession;
  laneUntilHitsCeiling: (params: {
    error: Error;
    candidates?: readonly {
      index: number;
      ref: number | null;
      within: string | null;
      text: string;
      rect: string;
    }[];
  }) => LaneSession;
  seedBookPresentAt: (params: { packagePath: string }) => void;
  seedLaneAnswers: (params: {
    apiBaseUrl: string;
    guild: Guild;
    questIds: readonly string[];
    secondGuild?: Guild;
  }) => { getCallArgs: () => readonly unknown[] };
  lastShotPath: () => string | null;
  setLastShotPath: (params: { path: string }) => void;
  clockAdvancing: (params: { startMs: number; stepMs: number }) => void;
} => {
  const dispatchProxy = stepDispatchBrokerProxy();
  isNativeErrorProxy();

  return {
    lastShotPath: dispatchProxy.lastShotPath,
    setLastShotPath: dispatchProxy.setLastShotPath,
    seedBookPresentAt: dispatchProxy.seedBookPresentAt,
    seedLaneAnswers: dispatchProxy.seedLaneAnswers,

    // A later, equally specific `Date.now` registration than `stepDispatchBrokerProxy`'s fixed one,
    // so it wins for every call: each read returns `stepMs` more than the last, starting at
    // `startMs + stepMs`.
    clockAdvancing: ({ startMs, stepMs }: { startMs: number; stepMs: number }): void => {
      const clock = { now: startMs };
      registerSpyOn({ object: Date, method: 'now' })
        .calledWith([])
        .implement(() => {
          clock.now += stepMs;
          return clock.now;
        });
    },

    laneGotoSucceeds: (): LaneSession =>
      LaneSessionStub({
        browser: { goto: jest.fn().mockResolvedValue(undefined) },
      }),

    laneGotoRejects: ({ error }: { error: Error }): LaneSession =>
      LaneSessionStub({
        browser: { goto: jest.fn().mockRejectedValue(error) },
      }),

    // A distinct scenario from laneGotoRejects rather than an extra param on it: laneGotoRejects
    // leaves `capture` at BrowserSessionStub's own default, which RESOLVES — so it already proves
    // the capture-succeeds half. This one is the only way to exercise the capture-FAILS half of the
    // same real failure.
    laneGotoRejectsAndCaptureFails: ({
      error,
      captureError,
    }: {
      error: Error;
      captureError: Error;
    }): LaneSession =>
      LaneSessionStub({
        browser: {
          goto: jest.fn().mockRejectedValue(error),
          capture: jest.fn().mockRejectedValue(captureError),
        },
      }),

    // A distinct scenario from laneGotoRejects rather than an extra param on it: this one exists
    // solely to give THIS broker's OWN serverWindow (assembled in its catch block, from the
    // `serverLogLength()` read before dispatch and the one after the rethrow) a real before/after
    // pair — laneGotoRejects's every existing caller expects the fixed {fromByte: 0, toByte: 0}
    // default.
    laneGotoRejectsWithServerLogWindow: ({
      error,
      serverLogLengthSequence,
    }: {
      error: Error;
      serverLogLengthSequence: readonly number[];
    }): LaneSession =>
      LaneSessionStub({
        serverLogLengthSequence,
        browser: { goto: jest.fn().mockRejectedValue(error) },
      }),

    // Zero matches staged: `waitFor` never pre-resolves, so a target absent for the whole wait must
    // still reach `waitForMatch` and end as a ceiling hit, never an immediate NO MATCH.
    laneWaitForHitsCeiling: ({ error }: { error: Error }): LaneSession =>
      LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ZERO_MATCH_COUNT)),
          waitForMatch: jest.fn().mockRejectedValue(error),
        },
      }),

    // `until { visible }` never goes through `stepTargetResolveBroker` either;
    // `runVerbLayerBroker` routes it to `session.waitForMatch` directly. `candidates` (default `[]`, matching `BrowserSessionStub`'s
    // own default) only matters for a strict-mode-violation `error` — DEF-92's own repro — since
    // `stepUntilBroker` calls `describeMatches` ONLY on that path, never on a genuine ceiling.
    laneUntilHitsCeiling: ({
      error,
      candidates = [],
    }: {
      error: Error;
      candidates?: readonly {
        index: number;
        ref: number | null;
        within: string | null;
        text: string;
        rect: string;
      }[];
    }): LaneSession =>
      LaneSessionStub({
        browser: {
          waitForMatch: jest.fn().mockRejectedValue(error),
          describeMatches: jest.fn().mockResolvedValue(candidates),
        },
      }),
  };
};
