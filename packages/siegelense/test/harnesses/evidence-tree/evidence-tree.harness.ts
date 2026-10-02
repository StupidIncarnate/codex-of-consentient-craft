/**
 * PURPOSE: Builds a real siegelense evidence tree — a two-row registry, a heartbeat file, two runs'
 * worth of transcripts and stored returns, real PNG screenshots, the three instance-level buffers and
 * the shared server log — under a fresh `installTestbedCreateBroker` temp dir, so the read-path
 * integration suite drives `resultsReadBroker` / `statusReadBroker` / `compareReadBroker` /
 * `cleanupRunBroker` against real files on disk rather than a mocked filesystem. Every screenshot is a
 * REAL PNG encoded by `pngjs`: `run_1/step1.png` is one solid `#0d0907` frame (proves `blank`),
 * `run_2/step1.png` differs over exactly half its pixels (proves `pixelChange` reads a real measured
 * value — deterministically 50.00% (50 px) with `includeAA:false` and two flat colour blocks). `beforeEach` mints
 * a brand-new testbed and rebuilds the whole tree, so one test's mutation (`cleanup`'s reap, or the
 * crash variant's deleted stored return) can never leak into the next. `readResults`/`readStatus`/
 * `readCompare`/`runCleanup`/`readRegistry`/`measureBlank`/`measureChange` wrap the seven read-path
 * brokers the suite exercises: the consuming file is `.integration.test.ts` colocated under
 * `flows/siegelense/`, and `@dungeonmaster/enforce-import-dependencies` refuses a `flows/` file
 * (its test included) importing `brokers/` directly, so this harness is the one door through.
 *
 * `addStaleAliveEntry` spawns a REAL detached `sleep` process for its pgid rather than a bare
 * literal: `instanceKillBroker`'s orphan-reap path now requires a candidate to answer alive before
 * it will signal or report it (DEF-69's safety fix — a stale, never-alive pgid must never be counted
 * as reaped), so proving the reap actually stops something needs a genuine live process group.
 *
 * USAGE:
 * const tree = evidenceTreeHarness();
 * // tree.beforeEach()/tree.afterEach() are auto-wired by the ts-jest harness transformer
 * const evidenceDir = tree.killedInstanceEvidenceDir();
 * tree.crashRun2(); // simulates run_2.jsonl present, run_2.json absent
 * const staleId = await tree.addStaleAliveEntry(); // a third, reapable row for the cleanup test
 * const answer = await tree.readResults({ query: ResultsQueryStub({ instanceId: tree.killedInstanceId() }) });
 */

import { Buffer } from '#gateway/node/buffer';
import { spawnDetached } from '#gateway/node/child_process';
import {
  closeSync,
  mkdirSync,
  openForAppendSync,
  unlinkSync,
  writeFileSync,
} from '#gateway/node/fs';
import { writeFileBytes } from '#gateway/node/fs__promises';
import { resolve as resolvePath } from '#gateway/node/path';
import { deleteEnv, getEnv, kill, setEnv, stderr } from '#gateway/node/process';
import { PNG } from '#gateway/npm/pngjs';

import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import type { SiegeInstance, SiegeRun } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { cleanupRunBroker } from '../../../src/brokers/cleanup/run/cleanup-run-broker';
import { compareReadBroker } from '../../../src/brokers/compare/read/compare-read-broker';
import { locationsBufferPathsFindBroker } from '../../../src/brokers/locations/buffer-paths-find/locations-buffer-paths-find-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../../src/brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRunPathsFindBroker } from '../../../src/brokers/locations/run-paths-find/locations-run-paths-find-broker';
import { locationsShotPathFindBroker } from '../../../src/brokers/locations/shot-path-find/locations-shot-path-find-broker';
import { registryReadBroker } from '../../../src/brokers/registry/read/registry-read-broker';
import { registryUpdateBroker } from '../../../src/brokers/registry/update/registry-update-broker';
import { registryWriteBroker } from '../../../src/brokers/registry/write/registry-write-broker';
import { resultsReadBroker } from '../../../src/brokers/results/read/results-read-broker';
import { shotBlankReadBroker } from '../../../src/brokers/shot/blank-read/shot-blank-read-broker';
import { shotChangeReadBroker } from '../../../src/brokers/shot/change-read/shot-change-read-broker';
import { statusReadBroker } from '../../../src/brokers/status/read/status-read-broker';
import { InstanceHeartbeatStub } from '../../../src/contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../src/contracts/instance-id/instance-id.stub';
import { PortPairStub } from '../../../src/contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../../src/contracts/registry-entry/registry-entry.stub';
import { RunIdStub } from '../../../src/contracts/run-id/run-id.stub';
import { RunResultStub } from '../../../src/contracts/run-result/run-result.stub';
import { ShotListingStub } from '../../../src/contracts/shot-listing/shot-listing.stub';
import { StepReadingStub } from '../../../src/contracts/step-reading/step-reading.stub';
import type { BlankReading } from '../../../src/contracts/blank-reading/blank-reading-contract';
import type { CleanupAnswer } from '../../../src/contracts/cleanup-answer/cleanup-answer-contract';
import type { CompareAnswer } from '../../../src/contracts/compare-answer/compare-answer-contract';
import type { CompareQuery } from '../../../src/contracts/compare-query/compare-query-contract';
import type { Registry } from '../../../src/contracts/registry/registry-contract';
import type { ResultsAnswer } from '../../../src/contracts/results-answer/results-answer-contract';
import type { ResultsQuery } from '../../../src/contracts/results-query/results-query-contract';
import type { RunResult } from '../../../src/contracts/run-result/run-result-contract';
import type { ServerLogWindow } from '../../../src/contracts/server-log-window/server-log-window-contract';
import type { StatusAnswer } from '../../../src/contracts/status-answer/status-answer-contract';
import type { StepReading } from '../../../src/contracts/step-reading/step-reading-contract';
import { ServerLogWindowStub } from '../../../src/contracts/server-log-window/server-log-window.stub';
import { RegistryStub } from '../../../src/contracts/registry/registry.stub';

const KILLED_INSTANCE_ID = InstanceIdStub({ value: 'inst_1111dead' });
const LIVE_INSTANCE_ID = InstanceIdStub({ value: 'inst_2222c0de' });
const STALE_INSTANCE_ID = InstanceIdStub({ value: 'inst_3333face' });
const UNKNOWN_INSTANCE_ID = InstanceIdStub({ value: 'inst_deadbeef' });
const RUN_1 = RunIdStub({ value: 'run_1' });
const RUN_2 = RunIdStub({ value: 'run_2' });
const BLANK_HEX = '#0d0907';
const IMAGE_SIDE = 10;
const DIFF_START_COL = 5;
const RGBA_CHANNELS = 4;
const OPAQUE_ALPHA = 255;
const STALE_LAST_BEAT_MS_AGO = 10 * 60 * 1000;

// listenerLinesTransformer's own console/network line shapes — the exact substrings
// resultsStatics.patterns matches against, so these fixture lines classify the same way a real
// browser capture would.
const CONSOLE_STEP1_LOG = JSON.stringify({
  at: 1,
  kind: 'console',
  type: 'log',
  text: 'navigating',
});
const CONSOLE_STEP2_ERROR = JSON.stringify({
  at: 2,
  kind: 'console',
  type: 'error',
  text: 'modal failed to open',
});
const CONSOLE_STEP2_WARNING = JSON.stringify({
  at: 3,
  kind: 'console',
  type: 'warning',
  text: 'slow modal',
});
const CONSOLE_STEP3_ERROR = JSON.stringify({
  at: 4,
  kind: 'console',
  type: 'error',
  text: 'eval issue',
});
const CONSOLE_RUN2_ERROR_A = JSON.stringify({
  at: 5,
  kind: 'console',
  type: 'error',
  text: 'new bug A',
});
const CONSOLE_RUN2_ERROR_B = JSON.stringify({
  at: 6,
  kind: 'console',
  type: 'error',
  text: 'new bug B',
});
const CONSOLE_RUN2_ERROR_C = JSON.stringify({
  at: 7,
  kind: 'console',
  type: 'error',
  text: 'new bug C',
});

const NETWORK_RUN1_OK = JSON.stringify({
  at: 1,
  method: 'GET',
  url: '/api/guilds',
  resourceType: 'fetch',
  status: 200,
  requestBody: null,
  responseBody: 'ok',
});
const NETWORK_RUN1_BAD = JSON.stringify({
  at: 2,
  method: 'POST',
  url: '/api/guilds',
  resourceType: 'fetch',
  status: 500,
  requestBody: null,
  responseBody: 'boom',
});
const NETWORK_RUN2_BAD_A = JSON.stringify({
  at: 3,
  method: 'POST',
  url: '/api/x',
  resourceType: 'fetch',
  status: 500,
  requestBody: null,
  responseBody: 'bad',
});
const NETWORK_RUN2_BAD_B = JSON.stringify({
  at: 4,
  method: 'GET',
  url: '/api/y',
  resourceType: 'fetch',
  status: 502,
  requestBody: null,
  responseBody: 'bad',
});

const SERVER_LINE_STEP1 = 'startup ok';
const SERVER_LINE_STEP2 = '[ERROR] inside window';
const SERVER_LINE_STEP3 = '[ERROR] outside window';
const SERVER_LINE_RUN2 = '[ERROR] run2 problem';

// This checkout's own root — one level above `packages/` — handed to the brokers that take a repo
// root as a parameter.
const REPO_ROOT = resolvePath(__dirname, '..', '..', '..', '..', '..');

export const evidenceTreeHarness = (): {
  beforeEach: () => Promise<void>;
  afterEach: () => void;
  killedInstanceId: () => SiegeInstance['id'];
  liveInstanceId: () => SiegeInstance['id'];
  staleInstanceId: () => SiegeInstance['id'];
  unknownInstanceId: () => SiegeInstance['id'];
  fakePgid: () => number;
  runOne: () => SiegeRun['id'];
  runTwo: () => SiegeRun['id'];
  killedInstanceEvidenceDir: () => string;
  run1Shot1Path: () => string;
  run2Shot1Path: () => string;
  run1Steps: () => readonly StepReading[];
  run2Steps: () => readonly StepReading[];
  run1Result: () => RunResult;
  run2Result: () => RunResult;
  run2StoredReturnPath: () => string;
  crashRun2: () => void;
  addStaleAliveEntry: () => Promise<SiegeInstance['id']>;
  consoleStep2Rows: () => readonly string[];
  consoleRun1ErrorRows: () => readonly string[];
  consoleRun2ErrorRows: () => readonly string[];
  serverInsideWindowRow: () => string;
  serverOutsideWindowRow: () => string;
  serverRun2ErrorRows: () => readonly string[];
  serverLogAllRows: () => readonly string[];
  networkRun1NonSuccessRows: () => readonly string[];
  networkRun2NonSuccessRows: () => readonly string[];
  // Read-path calls. `flows/` (and its colocated .integration.test.ts) may not import
  // `brokers/` directly — @dungeonmaster/enforce-import-dependencies — so the suite reaches
  // `results`/`status`/`compare`/`cleanup` and the two shot-measurement brokers through here.
  readResults: (params: { query: ResultsQuery }) => Promise<ResultsAnswer>;
  readStatus: (params: { instanceId: SiegeInstance['id'] | null }) => Promise<StatusAnswer>;
  readCompare: (params: { query: CompareQuery }) => Promise<CompareAnswer>;
  runCleanup: () => Promise<CleanupAnswer>;
  readRegistry: () => Promise<Registry>;
  measureBlank: (params: { shotPath: string }) => Promise<BlankReading>;
  measureChange: (params: {
    previousPath: string | null;
    currentPath: string;
  }) => Promise<string | null>;
} => {
  let testbed: ReturnType<typeof installTestbedCreateBroker> | null = null;
  let originalHome: ReturnType<typeof getEnv>;
  // A REAL detached child, spawned once addStaleAliveEntry runs — see this file's own PURPOSE for
  // why a bare literal pgid no longer proves anything.
  let staleChildPgid: number | null = null;

  const killedInstanceEvidenceDir = (): string =>
    locationsInstanceEvidencePathFindBroker({ instanceId: KILLED_INSTANCE_ID, guildId: null });

  const staleInstanceEvidenceDir = (): string =>
    locationsInstanceEvidencePathFindBroker({ instanceId: STALE_INSTANCE_ID, guildId: null });

  const run1Paths = (): ReturnType<typeof locationsRunPathsFindBroker> =>
    locationsRunPathsFindBroker({ evidencePath: killedInstanceEvidenceDir(), runId: RUN_1 });

  const run2Paths = (): ReturnType<typeof locationsRunPathsFindBroker> =>
    locationsRunPathsFindBroker({ evidencePath: killedInstanceEvidenceDir(), runId: RUN_2 });

  const run1Shot1Path = (): string =>
    locationsShotPathFindBroker({
      shotsDir: run1Paths().shotsDir,
      step: 1,
    });

  const run2Shot1Path = (): string =>
    locationsShotPathFindBroker({
      shotsDir: run2Paths().shotsDir,
      step: 1,
    });

  const writeSolidPng = async ({ filePath }: { filePath: string }): Promise<void> => {
    const png = new PNG({ width: IMAGE_SIDE, height: IMAGE_SIDE });
    for (let offset = 0; offset < png.data.length; offset += RGBA_CHANNELS) {
      png.data[offset] = 13;
      png.data[offset + 1] = 9;
      png.data[offset + 2] = 7;
      png.data[offset + 3] = OPAQUE_ALPHA;
    }
    await writeFileBytes(filePath, PNG.sync.write(png));
  };

  const writeHalfDifferentPng = async ({ filePath }: { filePath: string }): Promise<void> => {
    const png = new PNG({ width: IMAGE_SIDE, height: IMAGE_SIDE });
    for (let row = 0; row < IMAGE_SIDE; row += 1) {
      for (let col = 0; col < IMAGE_SIDE; col += 1) {
        const offset = (row * IMAGE_SIDE + col) * RGBA_CHANNELS;
        const differs = col >= DIFF_START_COL;
        png.data[offset] = differs ? 220 : 13;
        png.data[offset + 1] = differs ? 20 : 9;
        png.data[offset + 2] = differs ? 20 : 7;
        png.data[offset + 3] = OPAQUE_ALPHA;
      }
    }
    await writeFileBytes(filePath, PNG.sync.write(png));
  };

  // Byte offsets computed from the strings themselves rather than counted by hand, so the fixture
  // stays correct even if a line's text changes length later.
  const buildServerLog = (): {
    content: string;
    step1Window: ServerLogWindow;
    step2Window: ServerLogWindow;
    step3Window: ServerLogWindow;
    run2Window: ServerLogWindow;
  } => {
    const afterStep1 = `${SERVER_LINE_STEP1}\n`;
    const afterStep2 = `${afterStep1}${SERVER_LINE_STEP2}\n`;
    const afterStep3 = `${afterStep2}${SERVER_LINE_STEP3}\n`;
    const afterRun2 = `${afterStep3}${SERVER_LINE_RUN2}\n`;

    const byteCount = (text: string): number => Buffer.byteLength(text, 'utf8');

    return {
      content: afterRun2,
      step1Window: ServerLogWindowStub({ fromByte: byteCount(''), toByte: byteCount(afterStep1) }),
      step2Window: ServerLogWindowStub({
        fromByte: byteCount(afterStep1),
        toByte: byteCount(afterStep2),
      }),
      step3Window: ServerLogWindowStub({
        fromByte: byteCount(afterStep2),
        toByte: byteCount(afterStep3),
      }),
      run2Window: ServerLogWindowStub({
        fromByte: byteCount(afterStep3),
        toByte: byteCount(afterRun2),
      }),
    };
  };

  const bufferLine = ({
    runId,
    step,
    text,
  }: {
    runId: SiegeRun['id'];
    step: number;
    text: string;
  }): string => `${JSON.stringify({ runId, step, atMs: 1_700_000_000_000, text })}\n`;

  const consoleJsonl = (): string =>
    [
      bufferLine({ runId: RUN_1, step: 1, text: CONSOLE_STEP1_LOG }),
      bufferLine({ runId: RUN_1, step: 2, text: CONSOLE_STEP2_ERROR }),
      bufferLine({ runId: RUN_1, step: 2, text: CONSOLE_STEP2_WARNING }),
      bufferLine({ runId: RUN_1, step: 3, text: CONSOLE_STEP3_ERROR }),
      bufferLine({ runId: RUN_2, step: 1, text: CONSOLE_RUN2_ERROR_A }),
      bufferLine({ runId: RUN_2, step: 1, text: CONSOLE_RUN2_ERROR_B }),
      bufferLine({ runId: RUN_2, step: 1, text: CONSOLE_RUN2_ERROR_C }),
    ].join('');

  const networkJsonl = (): string =>
    [
      bufferLine({ runId: RUN_1, step: 1, text: NETWORK_RUN1_OK }),
      bufferLine({ runId: RUN_1, step: 2, text: NETWORK_RUN1_BAD }),
      bufferLine({ runId: RUN_2, step: 1, text: NETWORK_RUN2_BAD_A }),
      bufferLine({ runId: RUN_2, step: 1, text: NETWORK_RUN2_BAD_B }),
    ].join('');

  const run1Steps = (): readonly StepReading[] => {
    const serverLog = buildServerLog();
    return [
      StepReadingStub({
        step: 1,
        verb: 'goto',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'navigated to /',
        shot: run1Shot1Path(),
        pixelChange: null,
        blank: true,
        blankColour: BLANK_HEX,
        serverWindow: serverLog.step1Window,
        startedAtMs: 1_700_000_000_000,
        endedAtMs: 1_700_000_000_100,
      }),
      StepReadingStub({
        step: 2,
        verb: 'waitFor',
        node: 'open-guild-modal',
        ok: true,
        expected: 'ok',
        reading: 'matched 1 candidate',
        shot: null,
        pixelChange: null,
        blank: null,
        blankColour: null,
        serverWindow: serverLog.step2Window,
        startedAtMs: 1_700_000_000_100,
        endedAtMs: 1_700_000_000_200,
      }),
      StepReadingStub({
        step: 3,
        verb: 'eval',
        node: null,
        ok: true,
        expected: 'ok',
        reading: '"Guilds"',
        shot: null,
        pixelChange: null,
        blank: null,
        blankColour: null,
        serverWindow: serverLog.step3Window,
        startedAtMs: 1_700_000_000_200,
        endedAtMs: 1_700_000_000_300,
      }),
    ];
  };

  const run2Steps = (): readonly StepReading[] => {
    const serverLog = buildServerLog();
    return [
      StepReadingStub({
        step: 1,
        verb: 'goto',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'navigated to /missing',
        shot: run2Shot1Path(),
        pixelChange: '50.00% (50 px)',
        blank: false,
        blankColour: null,
        serverWindow: serverLog.run2Window,
        startedAtMs: 1_700_000_001_000,
        endedAtMs: 1_700_000_001_100,
      }),
    ];
  };

  const run1Result = (): RunResult =>
    RunResultStub({
      instanceId: KILLED_INSTANCE_ID,
      runId: RUN_1,
      status: 'done',
      stepsRun: 3,
      stoppedAt: null,
      index: {
        console: { errors: 2, warnings: 1 },
        server: { errors: 2 },
        network: { exchanges: 2, failed: 1 },
      },
      shots: [
        ShotListingStub({
          step: 1,
          path: run1Shot1Path(),
          open: true,
          why: 'blank',
          node: null,
          pixelChange: null,
          blank: true,
          blankColour: BLANK_HEX,
        }),
      ],
    });

  const run2Result = (): RunResult =>
    RunResultStub({
      instanceId: KILLED_INSTANCE_ID,
      runId: RUN_2,
      status: 'done',
      stepsRun: 1,
      stoppedAt: null,
      index: {
        console: { errors: 3, warnings: 0 },
        server: { errors: 1 },
        network: { exchanges: 2, failed: 2 },
      },
      shots: [
        ShotListingStub({
          step: 1,
          path: run2Shot1Path(),
          open: true,
          why: 'changed',
          node: null,
          pixelChange: '50.00% (50 px)',
          blank: false,
          blankColour: null,
        }),
      ],
    });

  const killedEntry = (): ReturnType<typeof RegistryEntryStub> =>
    RegistryEntryStub({
      id: KILLED_INSTANCE_ID,
      owner: '42781',
      specName: 'dungeonmaster-stack',
      specHash: 'a3f9c2e1',
      pid: null,
      pgids: [],
      socketPath: null,
      ports: PortPairStub({ api: 40_001, web: 40_002 }),
      state: 'killed',
      reservedAtMs: Date.now() - 600_000,
      bootedAtMs: null,
      lastBeatMs: null,
      prunedAtMs: null,
      prunedByRule: null,
    });

  const liveEntry = (): ReturnType<typeof RegistryEntryStub> =>
    RegistryEntryStub({
      id: LIVE_INSTANCE_ID,
      owner: '42781',
      specName: 'dungeonmaster-stack',
      specHash: 'a3f9c2e1',
      pid: 'proc-12345',
      pgids: [],
      socketPath: null,
      ports: PortPairStub({ api: 40_011, web: 40_012 }),
      state: 'alive',
      reservedAtMs: 1,
      bootedAtMs: Date.now() - 120_000,
      lastBeatMs: Date.now() - 2_000,
      prunedAtMs: null,
      prunedByRule: null,
    });

  const buildTree = async (): Promise<void> => {
    await registryWriteBroker({
      registry: RegistryStub({ instances: [killedEntry(), liveEntry()] }),
    });

    const evidenceDir = killedInstanceEvidenceDir();
    const runOnePaths = run1Paths();
    const runTwoPaths = run2Paths();
    mkdirSync(runOnePaths.shotsDir, { recursive: true });
    mkdirSync(runTwoPaths.shotsDir, { recursive: true });

    const heartbeat = InstanceHeartbeatStub({
      instanceId: KILLED_INSTANCE_ID,
      pid: 'proc-12345',
      pgids: [],
      beatAtMs: 1_700_000_000_000,
      rssMB: 1_840,
    });
    writeFileSync(
      `${evidenceDir}/${locationsStatics.siegelense.heartbeat}`,
      `${JSON.stringify(heartbeat)}\n`,
    );

    await writeSolidPng({ filePath: run1Shot1Path() });
    await writeHalfDifferentPng({ filePath: run2Shot1Path() });

    const bufferPaths = locationsBufferPathsFindBroker({ evidencePath: evidenceDir });
    writeFileSync(bufferPaths.console, consoleJsonl());
    writeFileSync(bufferPaths.network, networkJsonl());
    writeFileSync(bufferPaths.websocket, '');

    const serverLog = buildServerLog();
    writeFileSync(`${evidenceDir}/${locationsStatics.siegelense.apiLog}`, serverLog.content);

    writeFileSync(
      runOnePaths.transcript,
      run1Steps()
        .map((step) => `${JSON.stringify(step)}\n`)
        .join(''),
    );
    writeFileSync(runOnePaths.storedReturn, `${JSON.stringify(run1Result())}\n`);
    writeFileSync(
      runTwoPaths.transcript,
      run2Steps()
        .map((step) => `${JSON.stringify(step)}\n`)
        .join(''),
    );
    writeFileSync(runTwoPaths.storedReturn, `${JSON.stringify(run2Result())}\n`);
  };

  const beforeEach = async (): Promise<void> => {
    originalHome = getEnv('DUNGEONMASTER_HOME');
    const freshTestbed = installTestbedCreateBroker({
      baseName: 'evidence-tree',
    });
    testbed = freshTestbed;
    setEnv('DUNGEONMASTER_HOME', freshTestbed.guildPath);
    mkdirSync(`${freshTestbed.guildPath}/siegelense`, { recursive: true });

    await buildTree();
  };

  const afterEach = (): void => {
    // Backstop only: the normal case is the test's own `cleanup` call already reaped this pgid, so
    // ESRCH here is success, not failure — a test that fails BEFORE cleanup runs is what this
    // guards against, so no `sleep 300` from a broken test run lingers on the machine.
    if (staleChildPgid !== null) {
      try {
        kill(-staleChildPgid, 'SIGKILL');
      } catch (killError: unknown) {
        if (
          killError === null ||
          typeof killError !== 'object' ||
          !('code' in killError) ||
          killError.code !== 'ESRCH'
        ) {
          stderr.write(
            `evidenceTreeHarness: killing the stale fixture process failed: ${String(killError)}\n`,
          );
        }
      }
    }
    staleChildPgid = null;

    if (originalHome === undefined) {
      deleteEnv('DUNGEONMASTER_HOME');
    } else {
      setEnv('DUNGEONMASTER_HOME', originalHome);
    }
    testbed?.cleanup();
    testbed = null;
  };

  const crashRun2 = (): void => {
    unlinkSync(run2Paths().storedReturn);
  };

  const addStaleAliveEntry = async (): Promise<SiegeInstance['id']> => {
    const evidenceDir = staleInstanceEvidenceDir();
    mkdirSync(evidenceDir, { recursive: true });

    // Detached so it becomes its own session/process-group leader — its pid IS its pgid, the same
    // relationship `childProcessSpawnDetachedAdapter` relies on for a real driver's own lane
    // processes. `sleep` outlives any single test easily; afterEach force-kills it unconditionally
    // as a backstop for a test that fails before cleanup's own reap gets to it.
    const nullFd = openForAppendSync('/dev/null');
    const child = spawnDetached({
      command: 'sleep',
      args: ['300'],
      cwd: evidenceDir,
      stdoutFd: nullFd,
      stderrFd: nullFd,
    });
    closeSync(nullFd);
    const stalePgid = child.pgid;
    staleChildPgid = stalePgid;

    const heartbeat = InstanceHeartbeatStub({
      instanceId: STALE_INSTANCE_ID,
      pid: 'proc-12345',
      pgids: [stalePgid],
      beatAtMs: 1_700_000_000_000,
      rssMB: null,
    });
    writeFileSync(
      `${evidenceDir}/${locationsStatics.siegelense.heartbeat}`,
      `${JSON.stringify(heartbeat)}\n`,
    );

    const staleEntry = RegistryEntryStub({
      id: STALE_INSTANCE_ID,
      owner: '42781',
      specName: 'dungeonmaster-stack',
      specHash: 'a3f9c2e1',
      pid: 'proc-12345',
      // heartbeatWriteBroker stamps the SAME pgids onto heartbeat.json and this row in one call —
      // the fixture above is a lie unless this row names the same pgid, and instanceKillBroker's
      // orphan-reap path reads its candidates from THIS field, never the file.
      pgids: [stalePgid],
      socketPath: `${evidenceDir}/x.sock`,
      ports: PortPairStub({ api: 40_021, web: 40_022 }),
      state: 'alive',
      reservedAtMs: 1,
      bootedAtMs: Date.now() - 600_000,
      lastBeatMs: Date.now() - STALE_LAST_BEAT_MS_AGO,
      prunedAtMs: null,
      prunedByRule: null,
    });

    await registryUpdateBroker({
      mutate: (current) => RegistryStub({ instances: [...current.instances, staleEntry] }),
    });

    return STALE_INSTANCE_ID;
  };

  return {
    beforeEach,
    afterEach,
    killedInstanceId: () => KILLED_INSTANCE_ID,
    liveInstanceId: () => LIVE_INSTANCE_ID,
    staleInstanceId: () => STALE_INSTANCE_ID,
    unknownInstanceId: () => UNKNOWN_INSTANCE_ID,
    fakePgid: () => {
      if (staleChildPgid === null) {
        throw new Error('evidenceTreeHarness: fakePgid() called before addStaleAliveEntry()');
      }
      return staleChildPgid;
    },
    runOne: () => RUN_1,
    runTwo: () => RUN_2,
    killedInstanceEvidenceDir,
    run1Shot1Path,
    run2Shot1Path,
    run1Steps,
    run2Steps,
    run1Result,
    run2Result,
    run2StoredReturnPath: () => run2Paths().storedReturn,
    crashRun2,
    addStaleAliveEntry,
    consoleStep2Rows: () => [CONSOLE_STEP2_ERROR, CONSOLE_STEP2_WARNING],
    consoleRun1ErrorRows: () => [CONSOLE_STEP2_ERROR, CONSOLE_STEP3_ERROR],
    consoleRun2ErrorRows: () => [CONSOLE_RUN2_ERROR_A, CONSOLE_RUN2_ERROR_B, CONSOLE_RUN2_ERROR_C],
    serverInsideWindowRow: () => SERVER_LINE_STEP2,
    serverOutsideWindowRow: () => SERVER_LINE_STEP3,
    serverRun2ErrorRows: () => [SERVER_LINE_RUN2],
    serverLogAllRows: () => [
      SERVER_LINE_STEP1,
      SERVER_LINE_STEP2,
      SERVER_LINE_STEP3,
      SERVER_LINE_RUN2,
    ],
    networkRun1NonSuccessRows: () => [NETWORK_RUN1_BAD],
    networkRun2NonSuccessRows: () => [NETWORK_RUN2_BAD_A, NETWORK_RUN2_BAD_B],
    readResults: async ({ query }: { query: ResultsQuery }): Promise<ResultsAnswer> =>
      resultsReadBroker({ query }),
    readStatus: async ({
      instanceId,
    }: {
      instanceId: SiegeInstance['id'] | null;
    }): Promise<StatusAnswer> => statusReadBroker({ instanceId, repoRoot: REPO_ROOT }),
    readCompare: async ({ query }: { query: CompareQuery }): Promise<CompareAnswer> =>
      compareReadBroker({ query }),
    runCleanup: async (): Promise<CleanupAnswer> => cleanupRunBroker({ repoRoot: REPO_ROOT }),
    readRegistry: async (): Promise<Registry> => registryReadBroker(),
    measureBlank: async ({ shotPath }: { shotPath: string }): Promise<BlankReading> =>
      shotBlankReadBroker({ shotPath }),
    measureChange: async ({
      previousPath,
      currentPath,
    }: {
      previousPath: string | null;
      currentPath: string;
    }): Promise<string | null> => shotChangeReadBroker({ previousPath, currentPath }),
  };
};
