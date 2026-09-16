import { z } from 'zod';
import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { bufferAppendBrokerProxy } from '../../buffer/append/buffer-append-broker.proxy';
import { locationsBufferPathsFindBroker } from '../../locations/buffer-paths-find/locations-buffer-paths-find-broker';
import { locationsBufferPathsFindBrokerProxy } from '../../locations/buffer-paths-find/locations-buffer-paths-find-broker.proxy';
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

type BufferKind = 'console' | 'network' | 'websocket';

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
  laneWithGrowingConsoleBuffer: () => {
    lane: LaneSession;
    pushConsoleLine: (params: { text: ContentText }) => void;
  };
  headlessLane: () => LaneSession;
  laneRecordingTranscriptGrowth: (params: { transcriptPath: AbsoluteFilePath }) => {
    lane: LaneSession;
    snapshotsAtEachStep: () => readonly ReadingCount[];
  };
  transcriptWrites: (params: { transcriptPath: AbsoluteFilePath }) => readonly unknown[];
  storedReturnWrite: (params: { storedReturnPath: AbsoluteFilePath }) => unknown;
  flushCursor: () => {
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
  };
  advanceFlushCursor: (params: {
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
  }) => void;
  lastShotPath: () => AbsoluteFilePath | null;
  setLastShotPath: (params: { path: AbsoluteFilePath }) => void;
  writtenBufferEntriesFor: (params: { kind: BufferKind }) => unknown[];
  bufferAppendCallCountFor: (params: { kind: BufferKind }) => ReturnType<typeof ReadingCountStub>;
} => {
  // Satisfies enforce-proxy-child-creation for every broker/adapter run-execute-broker.ts imports.
  locationsRunPathsFindBrokerProxy();
  locationsShotPathFindBrokerProxy();
  locationsBufferPathsFindBrokerProxy();
  fsMkdirAdapterProxy(); // its own constructor already resolves ANY filepath — nothing to address.
  const transcriptProxy = runTranscriptAppendBrokerProxy();
  const returnWriteProxy = runReturnWriteBrokerProxy();
  const stepLayerProxy = runExecuteStepLayerBrokerProxy(); // also stages Date.now via its own child.

  // The three real buffer paths for EVIDENCE_PATH, computed with the REAL (pure, deterministic)
  // resolver — the same convention run-execute-broker.proxy.ts already uses for
  // locationsRunPathsFindBroker via stagePaths. Staged to succeed unconditionally so a test that
  // never cares about buffer flushing is never broken by it; `writtenBufferEntriesFor` reads back
  // exactly what was appended for one that does.
  const bufferPaths = locationsBufferPathsFindBroker({ evidencePath: EVIDENCE_PATH });
  const bufferAppendProxy = bufferAppendBrokerProxy();
  bufferAppendProxy.succeeds({ bufferPath: bufferPaths.console });
  bufferAppendProxy.succeeds({ bufferPath: bufferPaths.network });
  bufferAppendProxy.succeeds({ bufferPath: bufferPaths.websocket });

  // The instance's flush cursor, standing in for `driverSessionState` — a `const` holder whose
  // FIELD mutates (proxy files may not declare `let`/`var`). `lastShotPath`/`setLastShotPath`
  // forward to `stepLayerProxy`'s own (which forward again to `stepDispatchBrokerProxy`'s), so the
  // SAME pointer a step measures against is the one a test reads back — one object flows the whole
  // way down, exactly as it does in production.
  const cursorState: {
    current: {
      consoleLines: ReadingCount;
      networkLines: ReadingCount;
      websocketLines: ReadingCount;
    };
  } = {
    current: {
      consoleLines: ReadingCountStub({ value: 0 }),
      networkLines: ReadingCountStub({ value: 0 }),
      websocketLines: ReadingCountStub({ value: 0 }),
    },
  };

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

    // A REAL (stateful) growing buffer, unlike laneWithBrowserHistory's fixed snapshot — needed to
    // prove the per-step flush reads forward from wherever the cursor last left off rather than
    // replaying the same window every time. `pushConsoleLine` lets a test simulate a line arriving
    // with no step attached (e.g. between two runs), console.jsonl's own runId/step: null case.
    laneWithGrowingConsoleBuffer: (): {
      lane: LaneSession;
      pushConsoleLine: (params: { text: ContentText }) => void;
    } => {
      const consoleBuffer: ContentText[] = [];
      const gotoMock = jest.fn().mockImplementation(async () => {
        consoleBuffer.push(ContentTextStub({ value: `{"line":${String(consoleBuffer.length)}}` }));
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: gotoMock,
          capture: jest.fn().mockResolvedValue(undefined),
          bufferLengths: jest.fn().mockImplementation(() => ({
            consoleLines: bufferLineCountContract.parse(consoleBuffer.length),
            networkLines: bufferLineCountContract.parse(0),
            websocketLines: bufferLineCountContract.parse(0),
          })),
          readConsoleSince: jest
            .fn()
            .mockImplementation(({ fromIndex }: { fromIndex: number }) =>
              consoleBuffer.slice(fromIndex),
            ),
        },
      });
      return {
        lane,
        pushConsoleLine: ({ text }: { text: ContentText }): void => {
          consoleBuffer.push(text);
        },
      };
    },

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

    flushCursor: (): {
      consoleLines: ReadingCount;
      networkLines: ReadingCount;
      websocketLines: ReadingCount;
    } => cursorState.current,

    advanceFlushCursor: (next: {
      consoleLines: ReadingCount;
      networkLines: ReadingCount;
      websocketLines: ReadingCount;
    }): void => {
      cursorState.current = next;
    },

    lastShotPath: stepLayerProxy.lastShotPath,

    setLastShotPath: stepLayerProxy.setLastShotPath,

    writtenBufferEntriesFor: ({ kind }: { kind: BufferKind }): unknown[] =>
      bufferAppendProxy.writtenEntriesFor({ bufferPath: bufferPaths[kind] }),

    bufferAppendCallCountFor: ({
      kind,
    }: {
      kind: BufferKind;
    }): ReturnType<typeof ReadingCountStub> =>
      ReadingCountStub({
        value: bufferAppendProxy.appendCallsFor({ bufferPath: bufferPaths[kind] }).length,
      }),
  };
};
