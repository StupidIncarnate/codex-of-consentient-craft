import { z } from 'zod';
import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { locationsRunPathsFindBroker } from '../../locations/run-paths-find/locations-run-paths-find-broker';
import { locationsRunPathsFindBrokerProxy } from '../../locations/run-paths-find/locations-run-paths-find-broker.proxy';
import { locationsShotPathFindBrokerProxy } from '../../locations/shot-path-find/locations-shot-path-find-broker.proxy';
import { runReturnWriteBrokerProxy } from '../return-write/run-return-write-broker.proxy';
import { runTranscriptAppendBrokerProxy } from '../transcript-append/run-transcript-append-broker.proxy';
import { runExecuteStepLayerBrokerProxy } from './run-execute-step-layer-broker.proxy';

// Re-declared locally rather than imported: browser-session-contract.ts keeps its own parsing
// contract private, the same reason step-dispatch-broker.proxy.ts re-declares matchCountContract.
const bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const ONE_MATCH_COUNT = 1;

const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/repo/.siegelense/guilds/g1/instances/inst_1',
});

export const runExecuteBrokerProxy = (): {
  evidencePath: () => AbsoluteFilePath;
  stagePaths: (params: { runId: RunId }) => {
    transcript: AbsoluteFilePath;
    storedReturn: AbsoluteFilePath;
    shotsDir: AbsoluteFilePath;
  };
  cleanLane: () => LaneSession;
  laneFailingOnPath: (params: { failingPath: string; error: Error }) => {
    lane: LaneSession;
    gotoCallCount: () => ReadingCount;
  };
  laneHangingOnWaitFor: (params: { error: Error }) => {
    lane: LaneSession;
    gotoCallCount: () => ReadingCount;
  };
  laneWithBrowserHistory: (params: {
    consoleStart: ReadingCount;
    networkStart: ReadingCount;
    newConsoleLines: readonly ContentText[];
    newNetworkLines: readonly ContentText[];
  }) => LaneSession;
  headlessLane: () => LaneSession;
  laneRecordingTranscriptGrowth: (params: { transcriptPath: AbsoluteFilePath }) => {
    lane: LaneSession;
    snapshotsAtEachStep: () => readonly ReadingCount[];
  };
  transcriptWrites: (params: { transcriptPath: AbsoluteFilePath }) => readonly unknown[];
  storedReturnWrite: (params: { storedReturnPath: AbsoluteFilePath }) => unknown;
} => {
  // Satisfies enforce-proxy-child-creation for every broker/adapter run-execute-broker.ts imports.
  locationsRunPathsFindBrokerProxy();
  locationsShotPathFindBrokerProxy();
  fsMkdirAdapterProxy(); // its own constructor already resolves ANY filepath — nothing to address.
  const transcriptProxy = runTranscriptAppendBrokerProxy();
  const returnWriteProxy = runReturnWriteBrokerProxy();
  runExecuteStepLayerBrokerProxy(); // also stages Date.now via its own child, stepDispatchBrokerProxy.

  return {
    evidencePath: (): AbsoluteFilePath => EVIDENCE_PATH,

    stagePaths: ({
      runId,
    }: {
      runId: RunId;
    }): {
      transcript: AbsoluteFilePath;
      storedReturn: AbsoluteFilePath;
      shotsDir: AbsoluteFilePath;
    } => {
      const paths = locationsRunPathsFindBroker({ evidencePath: EVIDENCE_PATH, runId });
      transcriptProxy.succeeds({ transcriptPath: paths.transcript });
      returnWriteProxy.succeeds({ storedReturnPath: paths.storedReturn });
      return paths;
    },

    cleanLane: (): LaneSession =>
      LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: jest.fn().mockResolvedValue(undefined),
          capture: jest.fn().mockResolvedValue(undefined),
        },
      }),

    laneFailingOnPath: ({
      failingPath,
      error,
    }: {
      failingPath: string;
      error: Error;
    }): { lane: LaneSession; gotoCallCount: () => ReadingCount } => {
      const gotoMock = jest
        .fn()
        .mockImplementation(async ({ url }: { url: string }) =>
          url === failingPath ? Promise.reject(error) : Promise.resolve(undefined),
        );
      const lane = LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: { goto: gotoMock, capture: jest.fn().mockResolvedValue(undefined) },
      });
      return {
        lane,
        gotoCallCount: (): ReadingCount => ReadingCountStub({ value: gotoMock.mock.calls.length }),
      };
    },

    laneHangingOnWaitFor: ({
      error,
    }: {
      error: Error;
    }): { lane: LaneSession; gotoCallCount: () => ReadingCount } => {
      const gotoMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: gotoMock,
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          waitForMatch: jest.fn().mockRejectedValue(error),
          capture: jest.fn().mockResolvedValue(undefined),
        },
      });
      return {
        lane,
        gotoCallCount: (): ReadingCount => ReadingCountStub({ value: gotoMock.mock.calls.length }),
      };
    },

    laneWithBrowserHistory: ({
      consoleStart,
      networkStart,
      newConsoleLines,
      newNetworkLines,
    }: {
      consoleStart: ReadingCount;
      networkStart: ReadingCount;
      newConsoleLines: readonly ContentText[];
      newNetworkLines: readonly ContentText[];
    }): LaneSession =>
      LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: jest.fn().mockResolvedValue(undefined),
          capture: jest.fn().mockResolvedValue(undefined),
          // Re-branded from ReadingCount to BufferLineCount — both are non-negative ints under a
          // different domain brand, and the caller only has ReadingCount (an existing contract) to
          // hand in without this proxy file importing zod for a one-off local brand.
          bufferLengths: jest.fn().mockReturnValue({
            consoleLines: bufferLineCountContract.parse(consoleStart),
            networkLines: bufferLineCountContract.parse(networkStart),
            websocketLines: bufferLineCountContract.parse(0),
          }),
          // Only one call happens per run against each of these (after the whole step loop), with
          // fromIndex fixed to the window's own start — so a constant return is enough to prove the
          // window reads forward from THAT index rather than from zero.
          readConsoleSince: jest.fn().mockReturnValue(newConsoleLines),
          readNetworkSince: jest.fn().mockReturnValue(newNetworkLines),
        },
      }),

    headlessLane: (): LaneSession =>
      LaneSessionStub({ evidencePath: EVIDENCE_PATH, browser: null }),

    laneRecordingTranscriptGrowth: ({
      transcriptPath,
    }: {
      transcriptPath: AbsoluteFilePath;
    }): { lane: LaneSession; snapshotsAtEachStep: () => readonly ReadingCount[] } => {
      const snapshots: ReadingCount[] = [];
      const gotoMock = jest.fn().mockImplementation(async () => {
        snapshots.push(
          ReadingCountStub({
            value: transcriptProxy.appendedLinesFor({ transcriptPath }).length,
          }),
        );
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: { goto: gotoMock, capture: jest.fn().mockResolvedValue(undefined) },
      });
      return { lane, snapshotsAtEachStep: (): readonly ReadingCount[] => snapshots };
    },

    transcriptWrites: ({
      transcriptPath,
    }: {
      transcriptPath: AbsoluteFilePath;
    }): readonly unknown[] => transcriptProxy.appendedLinesFor({ transcriptPath }),

    storedReturnWrite: ({ storedReturnPath }: { storedReturnPath: AbsoluteFilePath }): unknown =>
      returnWriteProxy.writtenFor({ storedReturnPath }),
  };
};
