import { PNG } from 'pngjs';
import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { perceptionStatics } from '../../../statics/perception/perception-statics';
import { shotBlankReadBrokerProxy } from '../../shot/blank-read/shot-blank-read-broker.proxy';
import { shotChangeReadBrokerProxy } from '../../shot/change-read/shot-change-read-broker.proxy';
import { runVerbLayerBrokerProxy } from './run-verb-layer-broker.proxy';

const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const TWO_MATCHES_COUNT = 2;
const ONE_MATCH_COUNT = 1;
const FIXED_NOW_MS = 1_700_000_000_000;

// The wildcard default a shot path resolves to when a test never calls `stagesShotFrame` for it —
// most scenarios exercise the dispatch/inversion logic, not perception, and giving every one of
// them a real decodable frame is what keeps `shotBlankReadBroker`/`shotChangeReadBroker` from
// throwing on an unstaged path. More pixels than `perceptionStatics.blank.sampleStride` (7), with
// ONE differing sample, so the default reads `blank: false` rather than the trivially-true answer a
// frame no bigger than the stride would give — a test asserting the complete `StepReading` still
// gets a real, non-blank measurement rather than an accidental one that would flip
// `shotOpenDecideTransformer`'s new precedence for every existing shot-policy test.
const DEFAULT_SHOT_WIDTH = 4;
const DEFAULT_SHOT_HEIGHT = 2;
const BACKGROUND_RED = 0x0d;
const BACKGROUND_GREEN = 0x09;
const BACKGROUND_BLUE = 0x07;
const OPAQUE_ALPHA = 255;
const DIFFERING_CHANNEL = 255;
const BACKGROUND_PIXEL = [BACKGROUND_RED, BACKGROUND_GREEN, BACKGROUND_BLUE, OPAQUE_ALPHA];
const DIFFERING_PIXEL = [DIFFERING_CHANNEL, DIFFERING_CHANNEL, DIFFERING_CHANNEL, OPAQUE_ALPHA];
const defaultPixelRows = Array.from(
  { length: DEFAULT_SHOT_WIDTH * DEFAULT_SHOT_HEIGHT },
  () => BACKGROUND_PIXEL,
);
defaultPixelRows[perceptionStatics.blank.sampleStride] = DIFFERING_PIXEL;
const defaultPng = new PNG({ width: DEFAULT_SHOT_WIDTH, height: DEFAULT_SHOT_HEIGHT });
defaultPng.data = Buffer.from(new Uint8Array(defaultPixelRows.flat()));
const DEFAULT_SHOT_PNG_CONTENT = PNG.sync.write(defaultPng).toString('latin1');

export const stepDispatchBrokerProxy = (): {
  browserlessLane: (params: { specName: string }) => LaneSession;
  happyLane: () => { lane: LaneSession; captureCallArgs: () => readonly unknown[] };
  happyLaneWithServerLogWindow: (params: { serverLogLengthSequence: readonly number[] }) => {
    lane: LaneSession;
  };
  laneWithTwoMatches: () => { lane: LaneSession; clickMatchCallArgs: () => readonly unknown[] };
  laneRejectingClickMatch: (params: { error: Error }) => {
    lane: LaneSession;
    captureCallArgs: () => readonly unknown[];
  };
  laneRejectingClickMatchAndCapture: (params: { clickError: Error; captureError: Error }) => {
    lane: LaneSession;
    captureCallArgs: () => readonly unknown[];
  };
  laneRejectingWaitForMatch: (params: { error: Error }) => { lane: LaneSession };
  seedBookPresentAt: (params: { packagePath: string }) => void;
  seedLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: unknown;
    questIds: readonly ContentText[];
  }) => void;
  lastShotPath: () => AbsoluteFilePath | null;
  setLastShotPath: (params: { path: AbsoluteFilePath }) => void;
  stagesShotFrame: (params: {
    shotPath: AbsoluteFilePath;
    width: number;
    height: number;
    pixels: Uint8Array;
  }) => void;
  stagesShotReadError: (params: { shotPath: AbsoluteFilePath; error: Error }) => void;
} => {
  // This proxy builds its own BrowserSession scenarios directly, so only the SEED half of the verb
  // layer's own proxy is ever addressed: a `seed` step drives no page and so has no BrowserSession
  // scenario a lane stub could carry.
  const verbLayerProxy = runVerbLayerBrokerProxy();
  errorIsNativeErrorAdapterProxy();

  const dateHandle = registerSpyOn({ object: Date, method: 'now' });
  dateHandle.calledWith([]).returns(FIXED_NOW_MS);

  // Composed for the perception measurement `stepDispatchBroker` now performs on every captured
  // shot — `stagesShot` is for a test that cares about a specific pixel pattern, and
  // `stagesDefaultShot` (called on both — they share the SAME underlying `readFile` mock, so this
  // is belt-and-suspenders rather than two competing registrations) stages the wildcard default for
  // every path neither addresses individually.
  const blankReadProxy = shotBlankReadBrokerProxy();
  const changeReadProxy = shotChangeReadBrokerProxy();
  blankReadProxy.stagesDefaultShot({ content: DEFAULT_SHOT_PNG_CONTENT });
  changeReadProxy.stagesDefaultShot({ content: DEFAULT_SHOT_PNG_CONTENT });

  // The INSTANCE's last-capture pointer `pixelChange` compares against — a `const` holder whose
  // FIELD mutates (proxy files may not declare `let`/`var`), standing in for `driverSessionState`:
  // this proxy exercises `stepDispatchBroker` directly, the same way a real caller
  // (`runExecuteStepLayerBroker`) hands these two accessors down rather than importing `state/` (a
  // broker's allowed imports do not include it).
  const lastShotPathHolder: { current: AbsoluteFilePath | null } = { current: null };

  return {
    browserlessLane: ({ specName }: { specName: string }): LaneSession =>
      LaneSessionStub({ browser: null, specName }),

    happyLane: (): { lane: LaneSession; captureCallArgs: () => readonly unknown[] } => {
      const captureMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: {
          goto: jest.fn().mockResolvedValue(undefined),
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: jest.fn().mockResolvedValue(undefined),
          fillMatch: jest.fn().mockResolvedValue(undefined),
          waitForMatch: jest.fn().mockResolvedValue(undefined),
          capture: captureMock,
          evaluateSource: jest.fn().mockResolvedValue(contentTextContract.parse('"Guild Hall"')),
        },
      });
      return {
        lane,
        captureCallArgs: (): readonly unknown[] => captureMock.mock.calls,
      };
    },

    // A distinct scenario from happyLane rather than an extra param on it: this one exists solely
    // to give serverWindow a real before/after pair, and happyLane's every existing caller expects
    // the fixed {fromByte: 0, toByte: 0} default.
    happyLaneWithServerLogWindow: ({
      serverLogLengthSequence,
    }: {
      serverLogLengthSequence: readonly number[];
    }): { lane: LaneSession } => ({
      lane: LaneSessionStub({
        serverLogLengthSequence,
        browser: {
          goto: jest.fn().mockResolvedValue(undefined),
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: jest.fn().mockResolvedValue(undefined),
          fillMatch: jest.fn().mockResolvedValue(undefined),
          waitForMatch: jest.fn().mockResolvedValue(undefined),
          capture: jest.fn().mockResolvedValue(undefined),
          evaluateSource: jest.fn().mockResolvedValue(contentTextContract.parse('"Guild Hall"')),
        },
      }),
    }),

    laneWithTwoMatches: (): { lane: LaneSession; clickMatchCallArgs: () => readonly unknown[] } => {
      const clickMatchMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(TWO_MATCHES_COUNT)),
          describeMatches: jest.fn().mockResolvedValue([]),
          clickMatch: clickMatchMock,
        },
      });
      return {
        lane,
        clickMatchCallArgs: (): readonly unknown[] => clickMatchMock.mock.calls,
      };
    },

    laneRejectingClickMatch: ({
      error,
    }: {
      error: Error;
    }): { lane: LaneSession; captureCallArgs: () => readonly unknown[] } => {
      const captureMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: jest.fn().mockRejectedValue(error),
          capture: captureMock,
        },
      });
      return {
        lane,
        captureCallArgs: (): readonly unknown[] => captureMock.mock.calls,
      };
    },

    laneRejectingClickMatchAndCapture: ({
      clickError,
      captureError,
    }: {
      clickError: Error;
      captureError: Error;
    }): { lane: LaneSession; captureCallArgs: () => readonly unknown[] } => {
      const captureMock = jest.fn().mockRejectedValue(captureError);
      const lane = LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: jest.fn().mockRejectedValue(clickError),
          capture: captureMock,
        },
      });
      return {
        lane,
        captureCallArgs: (): readonly unknown[] => captureMock.mock.calls,
      };
    },

    laneRejectingWaitForMatch: ({ error }: { error: Error }): { lane: LaneSession } => ({
      lane: LaneSessionStub({
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          waitForMatch: jest.fn().mockRejectedValue(error),
        },
      }),
    }),

    lastShotPath: (): AbsoluteFilePath | null => lastShotPathHolder.current,

    setLastShotPath: ({ path }: { path: AbsoluteFilePath }): void => {
      lastShotPathHolder.current = path;
    },

    stagesShotFrame: ({
      shotPath,
      width,
      height,
      pixels,
    }: {
      shotPath: AbsoluteFilePath;
      width: number;
      height: number;
      pixels: Uint8Array;
    }): void => {
      blankReadProxy.stagesShot({ shotPath, width, height, pixels });
      changeReadProxy.stagesShot({ path: shotPath, width, height, pixels });
    },
    stagesShotReadError: ({
      shotPath,
      error,
    }: {
      shotPath: AbsoluteFilePath;
      error: Error;
    }): void => {
      blankReadProxy.stagesShotReadError({ shotPath, error });
    },
    seedBookPresentAt: ({ packagePath }: { packagePath: string }): void => {
      verbLayerProxy.seedBookPresentAt({ packagePath });
    },

    seedLaneAnswers: ({
      apiBaseUrl,
      guild,
      questIds,
    }: {
      apiBaseUrl: ContentText;
      guild: unknown;
      questIds: readonly ContentText[];
    }): void => {
      verbLayerProxy.seedLaneAnswers({ apiBaseUrl, guild, questIds });
    },
  };
};
