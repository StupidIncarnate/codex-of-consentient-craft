import { existsSync } from 'fs';
import { access, realpath } from 'fs/promises';
import { z } from 'zod';
import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import {
  absoluteFilePathContract,
  AbsoluteFilePathStub,
  ContentTextStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  ContentText,
  FilePath,
  Guild,
} from '@dungeonmaster/shared/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';
import { bufferAppendBrokerProxy } from '../../buffer/append/buffer-append-broker.proxy';
import { snapshotCaptureBroker } from '../../snapshot/capture/snapshot-capture-broker';
import { snapshotCaptureBrokerProxy } from '../../snapshot/capture/snapshot-capture-broker.proxy';
import { locationsBufferPathsFindBroker } from '../../locations/buffer-paths-find/locations-buffer-paths-find-broker';
import { locationsBufferPathsFindBrokerProxy } from '../../locations/buffer-paths-find/locations-buffer-paths-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { locationsRunPathsFindBroker } from '../../locations/run-paths-find/locations-run-paths-find-broker';
import { locationsRunPathsFindBrokerProxy } from '../../locations/run-paths-find/locations-run-paths-find-broker.proxy';
import { locationsShotPathFindBrokerProxy } from '../../locations/shot-path-find/locations-shot-path-find-broker.proxy';
import { runReturnWriteBrokerProxy } from '../return-write/run-return-write-broker.proxy';
import { runTranscriptAppendBrokerProxy } from '../transcript-append/run-transcript-append-broker.proxy';
import * as stepDispatchBrokerModule from '../../step/dispatch/step-dispatch-broker';
import { runExecuteStepLayerBrokerProxy } from './run-execute-step-layer-broker.proxy';

// Re-declared locally rather than imported: browser-session-contract.ts keeps its own parsing
// contract private, the same reason step-dispatch-broker.proxy.ts re-declares matchCountContract.
const bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const ONE_MATCH_COUNT = 1;

type BufferKind = 'console' | 'network' | 'websocket';

const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1',
});

// `CWD_PATH_VALUE` is `processCwdAdapterProxy`'s OWN sticky default, reused rather than staged, so
// the repo-root walk below is the ONLY thing about `locationsRepoLinkPathFindBroker`'s call this
// file ever addresses. Every stage in this file keys on the EXACT argument — a full path, or `[]`
// for a global taking none — rather than composing `locationsRepoLinkPathFindBrokerProxy`'s own
// `setupLinkAbsent`/`setupLinkResolvesToRoot`/`setupRootPath` scenario methods: those stage
// `pathJoinAdapter` with a ONE-SHOT, non-discriminating address (`onceFor([])`, matching ANY join
// call whatsoever), and `runExecuteBroker` itself makes several OTHER real `pathJoinAdapter` calls
// (locationsRunPathsFindBroker's three joins, run first) before it ever reaches this one — so a
// one-shot queued ahead of time is silently consumed by the wrong call, and this broker's own join
// answers with a stale value nobody asked for. A `calledWith`-keyed stage cannot collide with
// another caller's join, because the arguments differ.
const CWD_PATH_VALUE = '/default/cwd';
const CONFIG_FILE_PATH = FilePathStub({ value: `${CWD_PATH_VALUE}/.dungeonmaster.json` });
// A REAL `path.join(CWD_PATH_VALUE, '.dungeonmaster-assets', 'siegelense-assets')` — matches what
// the broker's own unstaged `pathJoinAdapter` call computes, so this address is exactly what a
// real run would check.
const LINK_PATH = FilePathStub({
  value: `${CWD_PATH_VALUE}/.dungeonmaster-assets/siegelense-assets`,
});

// `/home/default` is `osHomedirAdapterProxy`'s OWN sticky default — `stageRepoLinkPresent` below
// only has to clear `DUNGEONMASTER_HOME` (a prior test, or the real environment, could have it
// set) to let that default govern `dungeonmasterHomeFindBroker`. A different instance id
// ('inst_2') from EVIDENCE_PATH's own ('inst_1') so neither constant is ever mistaken for the
// other — this pair exists only for the one test proving the repo-local conversion itself.
// `locationsRepoLinkPathFindBroker` builds its answer with `homePath.replace(rootPath, linkPath)`,
// so `HOME_ROOTED_EVIDENCE_PATH` has to sit under `SIEGELENSE_ROOT_VALUE` for that substitution to
// mean anything.
const HOME_DIR_VALUE = '/home/default';
const SIEGELENSE_ROOT_VALUE = `${HOME_DIR_VALUE}/.dungeonmaster/siegelense`;
const HOME_ROOTED_EVIDENCE_PATH = AbsoluteFilePathStub({
  value: `${SIEGELENSE_ROOT_VALUE}/guilds/g1/instances/inst_2`,
});
const SEED_HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_seed' });

const REPO_LOCAL_EVIDENCE_PATH = AbsoluteFilePathStub({
  value: `${CWD_PATH_VALUE}/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_2`,
});

export const runExecuteBrokerProxy = (): {
  evidencePath: () => AbsoluteFilePath;
  stagePaths: (params: { runId: RunId; evidencePath?: AbsoluteFilePath }) => {
    transcript: AbsoluteFilePath;
    storedReturn: AbsoluteFilePath;
    shotsDir: AbsoluteFilePath;
  };
  stageRepoLinkPresent: () => void;
  homeRootedEvidencePath: () => AbsoluteFilePath;
  repoLocalEvidencePath: () => AbsoluteFilePath;
  cleanLane: () => LaneSession;
  laneRecordingGotoPaths: (params: { apiPort: number }) => {
    lane: LaneSession;
    gotoPaths: () => readonly unknown[];
  };
  seedBookPresent: () => void;
  seedLaneAnswers: (params: {
    apiBaseUrl: ContentText;
    guild: Guild;
    questIds: readonly ContentText[];
    secondGuild?: Guild;
  }) => { getCallArgs: () => readonly unknown[] };
  dispatchedSteps: () => readonly unknown[];
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
  laneClickTriggersNetworkLine: () => { lane: LaneSession };
  laneCapturingShots: (params?: { evidencePath?: AbsoluteFilePath }) => {
    lane: LaneSession;
    captureCalls: () => readonly AbsoluteFilePath[];
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
  capturedSnapshotCalls: () => unknown[];
  laneRecordingSnapshotGrowth: () => {
    lane: LaneSession;
    snapshotCountAtEachStep: () => readonly ReadingCount[];
  };
  failSnapshotCapture: (params: { error: Error }) => void;
} => {
  // Satisfies enforce-proxy-child-creation for every broker/adapter run-execute-broker.ts imports.
  locationsRunPathsFindBrokerProxy();
  locationsShotPathFindBrokerProxy();
  locationsBufferPathsFindBrokerProxy();
  fsMkdirAdapterProxy(); // its own constructor already resolves ANY filepath — nothing to address.
  // Constructed for enforce-proxy-child-creation only; `snapshotCaptureBroker` is staged directly
  // below because it carries its own suite. Deliberately BEFORE the step-layer proxy: this one
  // registers `Date.now` without staging it, so whatever the step layer stages afterwards is what
  // every StepReading's timestamps still come from.
  snapshotCaptureBrokerProxy();
  const transcriptProxy = runTranscriptAppendBrokerProxy();
  const returnWriteProxy = runReturnWriteBrokerProxy();
  const stepLayerProxy = runExecuteStepLayerBrokerProxy(); // also stages Date.now via its own child.
  const dispatchSpy = registerSpyOn({
    object: stepDispatchBrokerModule,
    method: 'stepDispatchBroker',
    passthrough: true,
  });

  // The two automatic captures a run makes at its own boundaries. Answered for ANY arguments, since
  // the interesting value is WHICH names were asked for, read back through the two methods below.
  const snapshotCaptureHandle: MockHandle = registerMock({ fn: snapshotCaptureBroker });
  snapshotCaptureHandle.calledWith([]).resolves(SnapshotRecordStub());

  // Satisfies enforce-proxy-child-creation for locationsRepoLinkPathFindBroker. Not composed as
  // fsAccessAdapterProxy/fsExistsSyncAdapterProxy/fsRealpathAdapterProxy — this implementation
  // never imports any of those directly, locationsRepoLinkPathFindBroker uses them transitively —
  // so the underlying node primitives are mocked here instead, the same convention
  // instance-kill-broker.proxy.ts uses for the identical broker.
  locationsRepoLinkPathFindBrokerProxy();
  const accessHandle: MockHandle = registerMock({ fn: access });
  const existsHandle: MockHandle = registerMock({ fn: existsSync });
  const realpathHandle: MockHandle = registerMock({ fn: realpath });
  // The repo-root walk `cwdResolveBroker` performs inside `locationsRepoLinkPathFindBroker`:
  // finds `.dungeonmaster.json` at CWD_PATH_VALUE itself, so the walk never has to climb a parent
  // directory this file never stages.
  accessHandle.calledWith([CONFIG_FILE_PATH]).resolves({ success: true as const });
  // No `.dungeonmaster-assets/siegelense-assets` link anywhere, by default — every test below gets
  // `linkPresent: false` and the real `shotsDir` it was given, unchanged, unless it calls
  // `stageRepoLinkPresent` below.
  existsHandle.calledWith([]).returns(false);

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
      evidencePath = EVIDENCE_PATH,
    }: {
      runId: RunId;
      evidencePath?: AbsoluteFilePath;
    }): {
      transcript: AbsoluteFilePath;
      storedReturn: AbsoluteFilePath;
      shotsDir: AbsoluteFilePath;
    } => {
      const paths = locationsRunPathsFindBroker({ evidencePath, runId });
      transcriptProxy.succeeds({ transcriptPath: paths.transcript });
      returnWriteProxy.succeeds({ storedReturnPath: paths.storedReturn });
      return paths;
    },

    // A `.dungeonmaster-assets/siegelense-assets` symlink at CWD_PATH_VALUE, resolving to
    // SIEGELENSE_ROOT_VALUE. Every stage
    // here is keyed on its EXACT argument (a path, or `[]` for homedir's own no-args call), so it
    // is safe regardless of how many other real `pathJoinAdapter` calls happen before or after it
    // — see this file's header comment on CWD_PATH_VALUE for why that matters.
    stageRepoLinkPresent: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      existsHandle.calledWith([LINK_PATH]).returns(true);
      realpathHandle.calledWith([LINK_PATH]).resolves(SIEGELENSE_ROOT_VALUE);
    },

    homeRootedEvidencePath: (): AbsoluteFilePath => HOME_ROOTED_EVIDENCE_PATH,
    repoLocalEvidencePath: (): AbsoluteFilePath => REPO_LOCAL_EVIDENCE_PATH,

    cleanLane: (): LaneSession =>
      LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: jest.fn().mockResolvedValue(undefined),
          capture: jest.fn().mockResolvedValue(undefined),
        },
      }),

    // A lane that records the URL of every goto it is asked for — what a test asserts a
    // `{g.guildSlug}` actually resolved to, since a placeholder that failed to substitute would
    // reach the browser as its own literal text.
    laneRecordingGotoPaths: ({
      apiPort,
    }: {
      apiPort: number;
    }): { lane: LaneSession; gotoPaths: () => readonly unknown[] } => {
      const gotoMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        homePath: SEED_HOME_PATH,
        ports: { api: apiPort, web: apiPort + 1 },
        browser: { goto: gotoMock, capture: jest.fn().mockResolvedValue(undefined) },
      });
      return {
        lane,
        gotoPaths: (): readonly unknown[] =>
          gotoMock.mock.calls.map((call: readonly unknown[]) => {
            const [first] = call;
            return first !== null && typeof first === 'object' && 'url' in first ? first.url : null;
          }),
      };
    },

    // Addressed at the path the REAL cwd and path-join resolution produce under this proxy's own
    // staging, rather than through `bookPresent()` — that one claims `process.cwd` and `path.join`
    // as one-shots, and this proxy is already using both for the run's own evidence paths.
    seedBookPresent: (): void => {
      stepLayerProxy.seedBookPresentAt({
        packagePath: FilePathStub({ value: '/default/cwd/packages/hydration-recipes' }),
      });
    },

    seedLaneAnswers: ({
      apiBaseUrl,
      guild,
      questIds,
      secondGuild,
    }: {
      apiBaseUrl: ContentText;
      guild: Guild;
      questIds: readonly ContentText[];
      secondGuild?: Guild;
    }): { getCallArgs: () => readonly unknown[] } =>
      stepLayerProxy.seedLaneAnswers({
        apiBaseUrl,
        guild,
        questIds,
        ...(secondGuild === undefined ? {} : { secondGuild }),
      }),

    dispatchedSteps: (): readonly unknown[] =>
      dispatchSpy.callsMatching([]).map((call) => {
        const [first] = call;
        return first !== null && typeof first === 'object' && 'step' in first ? first.step : null;
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

    // A `click` that pushes one network line into a REAL (stateful) array on every call — the
    // repro for the defect a real drive found: `until { response }` reading `fromIndex` off a fresh
    // `session.bufferLengths()` at the STEP's own start, rather than off `browserWindowStart` (the
    // RUN's own start), missed a POST an earlier step of the SAME run already fired. `bufferLengths`
    // and `readNetworkSince` read the SAME array, so calling `runExecuteBroker` twice against this
    // one lane (two runs sharing one session, exactly as a real driver's lane persists across `run`
    // calls) is what lets a test prove a match from an earlier RUN still sits before the SECOND
    // run's own window.
    laneClickTriggersNetworkLine: (): { lane: LaneSession } => {
      const networkBuffer: ContentText[] = [];
      const clickMock = jest.fn().mockImplementation(async () => {
        networkBuffer.push(
          ContentTextStub({
            value: JSON.stringify({ method: 'POST', url: '/api/guilds', status: 201 }),
          }),
        );
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: clickMock,
          capture: jest.fn().mockResolvedValue(undefined),
          bufferLengths: jest.fn().mockImplementation(() => ({
            consoleLines: bufferLineCountContract.parse(0),
            networkLines: bufferLineCountContract.parse(networkBuffer.length),
            websocketLines: bufferLineCountContract.parse(0),
          })),
          readNetworkSince: jest
            .fn()
            .mockImplementation(({ fromIndex }: { fromIndex: number }) =>
              networkBuffer.slice(fromIndex),
            ),
        },
      });
      return { lane };
    },

    // Records every `session.capture` call's `filePath`, in order — the acting steps' own unasked
    // capture and a `screenshot` step's explicit one land in the same log, so a test can assert the
    // FULL sequence of paths a batch actually wrote to, not just what `RunResult.shots` reports back.
    laneCapturingShots: ({
      evidencePath = EVIDENCE_PATH,
    }: { evidencePath?: AbsoluteFilePath } = {}): {
      lane: LaneSession;
      captureCalls: () => readonly AbsoluteFilePath[];
    } => {
      const captureMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        evidencePath,
        browser: { goto: jest.fn().mockResolvedValue(undefined), capture: captureMock },
      });
      return {
        lane,
        captureCalls: (): readonly AbsoluteFilePath[] =>
          (captureMock.mock.calls as [{ filePath: FilePath }][]).map(([{ filePath }]) =>
            absoluteFilePathContract.parse(filePath),
          ),
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

    // The WHOLE argument object of every automatic capture this run made, in order — so a test
    // asserts the home, the name and the manual flag together rather than picking one field out.
    capturedSnapshotCalls: (): unknown[] =>
      snapshotCaptureHandle.callsMatching([]).map((call) => call[0]),

    // A lane whose every `goto` records how many snapshots had been captured BY THEN — the only way
    // to prove the start half lands before the first step rather than merely being first in the list.
    laneRecordingSnapshotGrowth: (): {
      lane: LaneSession;
      snapshotCountAtEachStep: () => readonly ReadingCount[];
    } => {
      const counts: ReadingCount[] = [];
      const gotoMock = jest.fn().mockImplementation(async () => {
        counts.push(ReadingCountStub({ value: snapshotCaptureHandle.callsMatching([]).length }));
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        evidencePath: EVIDENCE_PATH,
        browser: { goto: gotoMock, capture: jest.fn().mockResolvedValue(undefined) },
      });
      return { lane, snapshotCountAtEachStep: (): readonly ReadingCount[] => counts };
    },

    // Overrides the constructor's catch-all, since a later registration at the same specificity
    // wins — the run must survive a capture that cannot be taken.
    failSnapshotCapture: ({ error }: { error: Error }): void => {
      snapshotCaptureHandle.calledWith([]).rejects(error);
    },
  };
};
