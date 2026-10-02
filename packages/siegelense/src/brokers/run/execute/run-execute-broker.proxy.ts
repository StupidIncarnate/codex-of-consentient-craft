import { z } from '#gateway/npm/zod';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { Guild, SiegeRun } from '@dungeonmaster/shared/contracts';

import { BufferLengthsStub } from '../../../contracts/buffer-lengths/buffer-lengths.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
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
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const ONE_MATCH_COUNT = 1;
const ZERO_MATCH_COUNT = 0;

type BufferKind = 'console' | 'network' | 'websocket';

const EVIDENCE_PATH = '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1';

// `REPO_ROOT_VALUE` is the `repoRoot` every lane this proxy builds carries, which `runExecuteBroker`
// hands to `locationsRepoLinkPathFindBroker`. This file stages `existsSync`/`realpath` for the
// link check directly (below) rather than composing `locationsRepoLinkPathFindBrokerProxy`'s own
// `setupLinkAbsent`/`setupLinkResolvesToRoot` scenario methods, the same convention
// instance-kill-broker.proxy.ts uses for the identical broker — `runExecuteBroker` itself makes
// several OTHER real `path.join` calls (locationsRunPathsFindBroker's three joins, run first),
// resolved for real through `#gateway/node/path`'s own `join`, unrelated to this file's own staging
// here.
const REPO_ROOT_VALUE = '/default/cwd';
// A REAL `path.join(REPO_ROOT_VALUE, '.dungeonmaster-assets', 'siegelense-assets')` — matches what
// the broker's own unstaged `join` call (via `#gateway/node/path`, staged by
// locationsRepoLinkPathFindBrokerProxy's own sticky real-passthrough default) computes, so this
// address is exactly what a real run would check.
const LINK_PATH = `${REPO_ROOT_VALUE}/.dungeonmaster-assets/siegelense-assets`;

// `stageRepoLinkPresent` stages the home through `repoLinkProxy.setupHomeOnly` (forwarded from
// locationsRootPathFindBrokerProxy) so `locationsRootPathFindBroker` resolves to
// SIEGELENSE_ROOT_VALUE, never a sticky override some other composed proxy happens to leave
// behind. A different instance id
// ('inst_2') from EVIDENCE_PATH's own ('inst_1') so neither constant is ever mistaken for the
// other — this pair exists only for the one test proving the repo-local conversion itself.
// `locationsRepoLinkPathFindBroker` builds its answer with `homePath.replace(rootPath, linkPath)`,
// so `HOME_ROOTED_EVIDENCE_PATH` has to sit under `SIEGELENSE_ROOT_VALUE` for that substitution to
// mean anything.
const HOME_DIR_VALUE = '/home/default';
const HOME_PATH_VALUE = `${HOME_DIR_VALUE}/.dungeonmaster`;
const HOME_PATH = HOME_PATH_VALUE;
const SIEGELENSE_ROOT_VALUE = `${HOME_PATH_VALUE}/siegelense`;
const HOME_ROOTED_EVIDENCE_PATH = `${SIEGELENSE_ROOT_VALUE}/guilds/g1/instances/inst_2`;
const SEED_HOME_PATH = '/tmp/dm-siege-inst_seed';

const REPO_LOCAL_EVIDENCE_PATH = `${REPO_ROOT_VALUE}/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_2`;

export const runExecuteBrokerProxy = (): {
  evidencePath: () => string;
  stagePaths: (params: { runId: SiegeRun['id']; evidencePath?: string }) => {
    transcript: string;
    storedReturn: string;
    shotsDir: string;
  };
  stageRepoLinkPresent: () => void;
  homeRootedEvidencePath: () => string;
  repoLocalEvidencePath: () => string;
  cleanLane: () => LaneSession;
  laneRecordingGotoPaths: (params: { apiPort: number }) => {
    lane: LaneSession;
    gotoPaths: () => readonly unknown[];
  };
  seedBookPresent: () => void;
  seedLaneAnswers: (params: {
    apiBaseUrl: string;
    guild: Guild;
    questIds: readonly string[];
    secondGuild?: Guild;
  }) => { getCallArgs: () => readonly unknown[] };
  dispatchedSteps: () => readonly unknown[];
  laneFailingOnPath: (params: { failingPath: string; error: Error }) => {
    lane: LaneSession;
    gotoCallCount: () => number;
  };
  laneHangingOnWaitFor: (params: { error: Error }) => {
    lane: LaneSession;
    gotoCallCount: () => number;
  };
  laneWithBrowserHistory: (params: {
    consoleStart: number;
    networkStart: number;
    newConsoleLines: readonly string[];
    newNetworkLines: readonly string[];
  }) => LaneSession;
  laneWithGrowingConsoleBuffer: () => {
    lane: LaneSession;
    pushConsoleLine: (params: { text: string }) => void;
  };
  laneClickTriggersNetworkLine: () => { lane: LaneSession };
  laneCapturingShots: (params?: { evidencePath?: string }) => {
    lane: LaneSession;
    captureCalls: () => readonly string[];
  };
  headlessLane: () => LaneSession;
  laneRecordingTranscriptGrowth: (params: { transcriptPath: string }) => {
    lane: LaneSession;
    snapshotsAtEachStep: () => readonly number[];
  };
  transcriptWrites: (params: { transcriptPath: string }) => readonly unknown[];
  storedReturnWrite: (params: { storedReturnPath: string }) => unknown;
  flushCursor: () => {
    consoleLines: number;
    networkLines: number;
    websocketLines: number;
  };
  advanceFlushCursor: (params: {
    consoleLines: number;
    networkLines: number;
    websocketLines: number;
  }) => void;
  lastShotPath: () => string | null;
  setLastShotPath: (params: { path: string }) => void;
  writtenBufferEntriesFor: (params: { kind: BufferKind }) => unknown[];
  bufferAppendCallCountFor: (params: { kind: BufferKind }) => number;
  capturedSnapshotCalls: () => unknown[];
  laneRecordingSnapshotGrowth: () => {
    lane: LaneSession;
    snapshotCountAtEachStep: () => readonly number[];
  };
  failSnapshotCapture: (params: { error: Error }) => void;
  getStderrText: () => string;
  clockAdvancing: (params: { startMs: number; stepMs: number }) => void;
} => {
  // Satisfies enforce-proxy-child-creation for every broker/adapter run-execute-broker.ts imports.
  locationsRunPathsFindBrokerProxy();
  locationsShotPathFindBrokerProxy();
  locationsBufferPathsFindBrokerProxy();
  // Unlike the old shared fsMkdirAdapter, ensureDirProxy has no permissive default — stagePaths
  // below addresses it at the exact shotsDir the same real locationsRunPathsFindBroker call computes.
  const mkdirProxy = ensureDirProxy();
  // A failed automatic snapshot is logged to stderr; the gateway proxy records it and keeps it off
  // the test runner's own output.
  const stderrLog = stderrProxy();
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

  // The two automatic captures a run makes at its own boundaries — `manual: false` addresses exactly
  // those, whatever home or name they carry; which names were asked for is read back through the
  // two methods below.
  const snapshotCaptureHandle: MockHandle = registerMock({ fn: snapshotCaptureBroker });
  snapshotCaptureHandle.calledWith([{ manual: false }]).resolves(SnapshotRecordStub());

  // Captured (not composed bare) so its scenario methods can stage the repo-root walk, the link
  // check and the addressed home. The link is absent by default — every test below gets
  // `linkPresent: false` and the real `shotsDir` it was given, unchanged, unless it calls
  // `stageRepoLinkPresent` below.
  const repoLinkProxy = locationsRepoLinkPathFindBrokerProxy();
  // Unconditional: locationsRepoLinkPathFindBroker joins the link path under the lane's repoRoot on
  // every invocation, which the absent-link scenario stages at REPO_ROOT_VALUE.
  repoLinkProxy.setupLinkAbsent({ repoRoot: REPO_ROOT_VALUE, linkPath: LINK_PATH });

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
      consoleLines: number;
      networkLines: number;
      websocketLines: number;
    };
  } = {
    current: {
      consoleLines: 0,
      networkLines: 0,
      websocketLines: 0,
    },
  };

  return {
    evidencePath: (): string => EVIDENCE_PATH,

    clockAdvancing: ({ startMs, stepMs }: { startMs: number; stepMs: number }): void => {
      stepLayerProxy.clockAdvancing({ startMs, stepMs });
    },

    stagePaths: ({
      runId,
      evidencePath = EVIDENCE_PATH,
    }: {
      runId: SiegeRun['id'];
      evidencePath?: string;
    }): {
      transcript: string;
      storedReturn: string;
      shotsDir: string;
    } => {
      const paths = locationsRunPathsFindBroker({ evidencePath, runId });
      mkdirProxy.succeeds({ path: String(paths.shotsDir) });
      transcriptProxy.succeeds({ transcriptPath: paths.transcript });
      returnWriteProxy.succeeds({ storedReturnPath: paths.storedReturn });
      return paths;
    },

    // A `.dungeonmaster-assets/siegelense-assets` symlink at REPO_ROOT_VALUE, resolving to
    // SIEGELENSE_ROOT_VALUE. Every stage
    // here is keyed on its EXACT argument (a path, or `[]` for homedir's own no-args call), so it
    // is safe regardless of how many other real `#gateway/node/path` `join` calls happen before or
    // after it — see this file's header comment on REPO_ROOT_VALUE for why that matters.
    stageRepoLinkPresent: (): void => {
      repoLinkProxy.setupLinkResolvesToRoot({
        repoRoot: REPO_ROOT_VALUE,
        linkPath: LINK_PATH,
        homeDir: HOME_DIR_VALUE,
        homePath: HOME_PATH,
        rootPath: SIEGELENSE_ROOT_VALUE,
      });
    },

    homeRootedEvidencePath: (): string => HOME_ROOTED_EVIDENCE_PATH,
    repoLocalEvidencePath: (): string => REPO_LOCAL_EVIDENCE_PATH,

    cleanLane: (): LaneSession =>
      LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
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
        repoRoot: REPO_ROOT_VALUE,
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
        packagePath: '/default/cwd/packages/hydration-recipes',
      });
    },

    seedLaneAnswers: ({
      apiBaseUrl,
      guild,
      questIds,
      secondGuild,
    }: {
      apiBaseUrl: string;
      guild: Guild;
      questIds: readonly string[];
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
    }): { lane: LaneSession; gotoCallCount: () => number } => {
      const gotoMock = jest
        .fn()
        .mockImplementation(async ({ url }: { url: string }) =>
          url === failingPath ? Promise.reject(error) : Promise.resolve(undefined),
        );
      const lane = LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath: EVIDENCE_PATH,
        browser: { goto: gotoMock, capture: jest.fn().mockResolvedValue(undefined) },
      });
      return {
        lane,
        gotoCallCount: (): number => gotoMock.mock.calls.length,
      };
    },

    laneHangingOnWaitFor: ({
      error,
    }: {
      error: Error;
    }): { lane: LaneSession; gotoCallCount: () => number } => {
      const gotoMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: gotoMock,
          // Zero matches for the whole wait: `waitFor` never pre-resolves, so this still reaches
          // `waitForMatch` and ends as a ceiling hit rather than an immediate NO MATCH.
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ZERO_MATCH_COUNT)),
          waitForMatch: jest.fn().mockRejectedValue(error),
          capture: jest.fn().mockResolvedValue(undefined),
        },
      });
      return {
        lane,
        gotoCallCount: (): number => gotoMock.mock.calls.length,
      };
    },

    laneWithBrowserHistory: ({
      consoleStart,
      networkStart,
      newConsoleLines,
      newNetworkLines,
    }: {
      consoleStart: number;
      networkStart: number;
      newConsoleLines: readonly string[];
      newNetworkLines: readonly string[];
    }): LaneSession =>
      LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: jest.fn().mockResolvedValue(undefined),
          capture: jest.fn().mockResolvedValue(undefined),
          bufferLengths: jest
            .fn()
            .mockReturnValue(
              BufferLengthsStub({ consoleLines: consoleStart, networkLines: networkStart }),
            ),
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
      pushConsoleLine: (params: { text: string }) => void;
    } => {
      const consoleBuffer: string[] = [];
      const gotoMock = jest.fn().mockImplementation(async () => {
        consoleBuffer.push(`{"line":${String(consoleBuffer.length)}}`);
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath: EVIDENCE_PATH,
        browser: {
          goto: gotoMock,
          capture: jest.fn().mockResolvedValue(undefined),
          bufferLengths: jest
            .fn()
            .mockImplementation(() => BufferLengthsStub({ consoleLines: consoleBuffer.length })),
          readConsoleSince: jest
            .fn()
            .mockImplementation(({ fromIndex }: { fromIndex: number }) =>
              consoleBuffer.slice(fromIndex),
            ),
        },
      });
      return {
        lane,
        pushConsoleLine: ({ text }: { text: string }): void => {
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
      const networkBuffer: string[] = [];
      const clickMock = jest.fn().mockImplementation(async () => {
        networkBuffer.push(JSON.stringify({ method: 'POST', url: '/api/guilds', status: 201 }));
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath: EVIDENCE_PATH,
        browser: {
          countMatches: jest.fn().mockResolvedValue(matchCountContract.parse(ONE_MATCH_COUNT)),
          clickMatch: clickMock,
          capture: jest.fn().mockResolvedValue(undefined),
          bufferLengths: jest
            .fn()
            .mockImplementation(() => BufferLengthsStub({ networkLines: networkBuffer.length })),
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
    laneCapturingShots: ({ evidencePath = EVIDENCE_PATH }: { evidencePath?: string } = {}): {
      lane: LaneSession;
      captureCalls: () => readonly string[];
    } => {
      const captureMock = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath,
        browser: { goto: jest.fn().mockResolvedValue(undefined), capture: captureMock },
      });
      return {
        lane,
        captureCalls: (): readonly string[] =>
          (captureMock.mock.calls as [{ filePath: string }][]).map(([{ filePath }]) => filePath),
      };
    },

    headlessLane: (): LaneSession =>
      LaneSessionStub({ repoRoot: REPO_ROOT_VALUE, evidencePath: EVIDENCE_PATH, browser: null }),

    laneRecordingTranscriptGrowth: ({
      transcriptPath,
    }: {
      transcriptPath: string;
    }): { lane: LaneSession; snapshotsAtEachStep: () => readonly number[] } => {
      const snapshots: number[] = [];
      const gotoMock = jest.fn().mockImplementation(async () => {
        snapshots.push(transcriptProxy.appendedLinesFor({ transcriptPath }).length);
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath: EVIDENCE_PATH,
        browser: { goto: gotoMock, capture: jest.fn().mockResolvedValue(undefined) },
      });
      return { lane, snapshotsAtEachStep: (): readonly number[] => snapshots };
    },

    transcriptWrites: ({ transcriptPath }: { transcriptPath: string }): readonly unknown[] =>
      transcriptProxy.appendedLinesFor({ transcriptPath }),

    storedReturnWrite: ({ storedReturnPath }: { storedReturnPath: string }): unknown =>
      returnWriteProxy.writtenFor({ storedReturnPath }),

    flushCursor: (): {
      consoleLines: number;
      networkLines: number;
      websocketLines: number;
    } => cursorState.current,

    advanceFlushCursor: (next: {
      consoleLines: number;
      networkLines: number;
      websocketLines: number;
    }): void => {
      cursorState.current = next;
    },

    lastShotPath: stepLayerProxy.lastShotPath,

    setLastShotPath: stepLayerProxy.setLastShotPath,

    writtenBufferEntriesFor: ({ kind }: { kind: BufferKind }): unknown[] =>
      bufferAppendProxy.writtenEntriesFor({ bufferPath: bufferPaths[kind] }),

    bufferAppendCallCountFor: ({ kind }: { kind: BufferKind }): number =>
      bufferAppendProxy.appendCallsFor({ bufferPath: bufferPaths[kind] }).length,

    // The WHOLE argument object of every automatic capture this run made, in order — so a test
    // asserts the home, the name and the manual flag together rather than picking one field out.
    capturedSnapshotCalls: (): unknown[] =>
      snapshotCaptureHandle.callsMatching([]).map((call) => call[0]),

    // A lane whose every `goto` records how many snapshots had been captured BY THEN — the only way
    // to prove the start half lands before the first step rather than merely being first in the list.
    laneRecordingSnapshotGrowth: (): {
      lane: LaneSession;
      snapshotCountAtEachStep: () => readonly number[];
    } => {
      const counts: number[] = [];
      const gotoMock = jest.fn().mockImplementation(async () => {
        counts.push(snapshotCaptureHandle.callsMatching([]).length);
        return Promise.resolve(undefined);
      });
      const lane = LaneSessionStub({
        repoRoot: REPO_ROOT_VALUE,
        evidencePath: EVIDENCE_PATH,
        browser: { goto: gotoMock, capture: jest.fn().mockResolvedValue(undefined) },
      });
      return { lane, snapshotCountAtEachStep: (): readonly number[] => counts };
    },

    // Overrides the constructor's answer, since a later registration at the same specificity
    // wins — the run must survive a capture that cannot be taken.
    failSnapshotCapture: ({ error }: { error: Error }): void => {
      snapshotCaptureHandle.calledWith([{ manual: false }]).rejects(error);
    },

    getStderrText: (): string => stderrLog.getWrittenText(),
  };
};
