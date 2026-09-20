import { z } from 'zod';
import type {
  AbsoluteFilePath,
  ContentText,
  FilePath,
  Guild,
} from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { stepDispatchBrokerProxy } from '../../step/dispatch/step-dispatch-broker.proxy';

// Re-declared locally rather than imported: browser-session-contract.ts keeps its own parsing
// contract private, the same reason step-dispatch-broker.proxy.ts re-declares matchCountContract.
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const ONE_MATCH_COUNT = 1;

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
  laneUntilHitsCeiling: (params: { error: Error }) => LaneSession;
  seedBookPresentAt: (params: { packagePath: FilePath }) => void;
  seedLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: Guild;
    questIds: readonly ContentText[];
    secondGuild?: Guild;
  }) => { getCallArgs: () => readonly unknown[] };
  lastShotPath: () => AbsoluteFilePath | null;
  setLastShotPath: (params: { path: AbsoluteFilePath }) => void;
} => {
  const dispatchProxy = stepDispatchBrokerProxy();
  errorIsNativeErrorAdapterProxy();

  return {
    lastShotPath: dispatchProxy.lastShotPath,
    setLastShotPath: dispatchProxy.setLastShotPath,
    seedBookPresentAt: dispatchProxy.seedBookPresentAt,
    seedLaneAnswers: dispatchProxy.seedLaneAnswers,

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

    laneWaitForHitsCeiling: ({ error }: { error: Error }): LaneSession =>
      LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          waitForMatch: jest.fn().mockRejectedValue(error),
        },
      }),

    // No `countMatches` staged, unlike `laneWaitForHitsCeiling` above: `until { visible }` never
    // goes through `stepTargetResolveBroker` at all — pre-resolving is the whole reason `waitFor`
    // cannot wait for an element to appear, and `runVerbLayerBroker` routes `until` to
    // `session.waitForMatch` directly.
    laneUntilHitsCeiling: ({ error }: { error: Error }): LaneSession =>
      LaneSessionStub({
        browser: { waitForMatch: jest.fn().mockRejectedValue(error) },
      }),
  };
};
