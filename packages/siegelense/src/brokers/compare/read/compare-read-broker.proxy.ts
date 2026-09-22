import type { AbsoluteFilePath, ContentText, GuildId } from '@dungeonmaster/shared/contracts';

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import type { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import type { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';
import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { instanceStateResolveBrokerProxy } from '../../instance/state-resolve/instance-state-resolve-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRunPathsFindBrokerProxy } from '../../locations/run-paths-find/locations-run-paths-find-broker.proxy';
import { resultsReadBrokerProxy } from '../../results/read/results-read-broker.proxy';
import { shotChangeReadBrokerProxy } from '../../shot/change-read/shot-change-read-broker.proxy';
import { elementDeltaLastLayerBrokerProxy } from './element-delta-last-layer-broker.proxy';
import { newLinesLayerBrokerProxy } from './new-lines-layer-broker.proxy';

type RegistryEntry = ReturnType<typeof RegistryEntryStub>;
type RunId = ReturnType<typeof RunIdStub>;
type RunResult = ReturnType<typeof RunResultStub>;
type StepReading = ReturnType<typeof StepReadingStub>;

// Every staged console line needs an `atMs` to satisfy `bufferEntryContract` — compareReadBroker
// never reads it back, so one fixed constant keeps every staged line byte-for-byte reproducible.
const FIXTURE_AT_MS = 1_700_000_000_000;

export const compareReadBrokerProxy = (): {
  evidencePathFor: (params: {
    instanceId: InstanceId;
    guildId?: GuildId | null;
  }) => AbsoluteFilePath;
  setupInstance: (params: { entry: RegistryEntry }) => void;
  setupUnknownInstance: () => void;
  setupRun: (params: { evidencePath: AbsoluteFilePath; runId: RunId; result: RunResult }) => void;
  setupMissingRun: (params: { evidencePath: AbsoluteFilePath; runId: RunId }) => void;
  stagesShotFrame: (params: {
    path: AbsoluteFilePath;
    width: number;
    height: number;
    pixels: Uint8Array;
  }) => void;
  setupConsoleLines: (params: {
    evidencePath: AbsoluteFilePath;
    runId: RunId;
    lines: readonly ContentText[];
  }) => void;
  setupNetworkLines: (params: {
    evidencePath: AbsoluteFilePath;
    runId: RunId;
    lines: readonly ContentText[];
  }) => void;
  setupStepReadings: (params: {
    evidencePath: AbsoluteFilePath;
    runId: RunId;
    readings: readonly StepReading[];
  }) => void;
} => {
  // Composing the `results` domain's own entry-file proxy is deliberate, not incidental: it is the
  // one place that already resolves a real, repeatable evidence path (a sticky `homedir()` mock plus
  // a REAL `path.join` passthrough — never a one-shot override), which this file now needs because
  // `compareReadBroker` drives `resultsReadBroker` through that same path several times over in one
  // call, not just once.
  // These four are already covered transitively by `resultsReadBrokerProxy()` below — composed here
  // too only because `enforce-proxy-child-creation` matches on this file's OWN import list against
  // `compare-read-broker.ts`'s, not on what a composed proxy pulls in underneath it. `registerMock`
  // keys on the underlying function, so a second composition of the same target is a no-op — EXCEPT
  // for the shared `homedir()` mock's own sticky default, which the MOST RECENT composer wins. These
  // four must come BEFORE `resultsReadBrokerProxy()`, so its own '/home/user' registration (last in
  // ITS constructor) is the one every evidence-path resolution actually gets.
  fsReadFileAdapterProxy();
  errorIsNativeErrorAdapterProxy();
  instanceStateResolveBrokerProxy();
  locationsInstanceEvidencePathFindBrokerProxy();
  locationsRunPathsFindBrokerProxy();
  const resultsProxy = resultsReadBrokerProxy();
  const shotChangeProxy = shotChangeReadBrokerProxy();
  newLinesLayerBrokerProxy();
  elementDeltaLastLayerBrokerProxy();

  const consoleLinesByRun = new Map<RunId, readonly ContentText[]>();
  const networkLinesByRun = new Map<RunId, readonly ContentText[]>();

  return {
    evidencePathFor: (params: {
      instanceId: InstanceId;
      guildId?: GuildId | null;
    }): AbsoluteFilePath => resultsProxy.evidencePathFor(params),

    setupInstance: ({ entry }: { entry: RegistryEntry }): void => {
      resultsProxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      const evidencePath = resultsProxy.evidencePathFor({
        instanceId: entry.id,
        guildId: entry.guildId,
      });
      // Every buffer/transcript/log resultsReadBroker touches must be staged one way or another — an
      // unaddressed path throws rather than answering ENOENT. Empty content behaves exactly like a
      // missing file for `bufferReadLayerBroker`/`transcriptReadLayerBroker` (both split on '\n' and
      // filter empty lines), so this is the safe "nothing recorded yet" default every test gets for
      // free; `setupConsoleLines`/`setupNetworkLines` below override the buffers per instance, and
      // `setupStepReadings` overrides the transcript per run. The server log is staged here too,
      // ahead of any real need: `setupStepReadings` writes `StepReading`s whose `serverWindow` is
      // never nullable, so the moment a test stages ONE real step, `results { kind: 'server' }`
      // (which `compare` also drives) has a byte range to slice and reads `api-server.log` for real.
      resultsProxy.setupBuffer({ evidencePath, kind: 'console', content: '' });
      resultsProxy.setupBuffer({ evidencePath, kind: 'network', content: '' });
      resultsProxy.setupServerLog({ evidencePath, content: '' });
    },

    // A present-but-empty registry — the honest shape of a typo'd or never-existed id, distinct
    // from a missing registry.json entirely (that path is `registryReadBrokerProxy`'s own
    // `setupMissingRegistry`, a different broker's concern).
    setupUnknownInstance: (): void => {
      resultsProxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
    },

    setupRun: ({
      evidencePath,
      runId,
      result,
    }: {
      evidencePath: AbsoluteFilePath;
      runId: RunId;
      result: RunResult;
    }): void => {
      // A real run leaves BOTH files — the transcript is what a run writes as it goes, the stored
      // return only at its closing write. Staging only one describes a run compareReadBroker itself
      // has already proved exists as something resultsReadBroker's own directory listing does not
      // recognise — every other `results` fixture in this package lists both suffixes for a run
      // that is actually there (see resultsReadBrokerProxy.setupRun-style calls elsewhere).
      resultsProxy.setupRuns({ evidencePath, entries: [`${runId}.jsonl`, `${runId}.json`] });
      resultsProxy.setupStoredReturn({ evidencePath, runId, result });
      // An empty transcript gives `serverWindowReadLayerBroker` no steps to window, so it answers
      // `[]` without ever reading `api-server.log` — the same safe "nothing recorded yet" default
      // as the two buffers above.
      resultsProxy.setupTranscript({ evidencePath, runId, content: '' });
    },

    // A KNOWN instance whose named run never stored a return — the run count reads real, the file
    // does not. `resultsProxy.setupMissingStoredReturn` stages the same ENOENT shape a real crashed
    // or never-completed run leaves on disk.
    setupMissingRun: ({
      evidencePath,
      runId,
    }: {
      evidencePath: AbsoluteFilePath;
      runId: RunId;
    }): void => {
      resultsProxy.setupMissingStoredReturn({ evidencePath, runId });
    },

    stagesShotFrame: ({
      path,
      width,
      height,
      pixels,
    }: {
      path: AbsoluteFilePath;
      width: number;
      height: number;
      pixels: Uint8Array;
    }): void => {
      shotChangeProxy.stagesShot({ path, width, height, pixels });
    },

    setupConsoleLines: ({
      evidencePath,
      runId,
      lines,
    }: {
      evidencePath: AbsoluteFilePath;
      runId: RunId;
      lines: readonly ContentText[];
    }): void => {
      // console.jsonl is one append-only file per INSTANCE, shared by every run — so staging run B's
      // lines must not erase run A's. Every call re-stages the FULL accumulated content across every
      // run set up so far, keyed by runId exactly like the real buffer entries
      // `bufferReadLayerBroker` filters on.
      consoleLinesByRun.set(runId, lines);
      const content = [...consoleLinesByRun.entries()]
        .flatMap(([taggedRunId, taggedLines]) =>
          taggedLines.map(
            (text) =>
              `${JSON.stringify({ runId: taggedRunId, step: null, atMs: FIXTURE_AT_MS, text })}\n`,
          ),
        )
        .join('');
      resultsProxy.setupBuffer({ evidencePath, kind: 'console', content });
    },

    setupNetworkLines: ({
      evidencePath,
      runId,
      lines,
    }: {
      evidencePath: AbsoluteFilePath;
      runId: RunId;
      lines: readonly ContentText[];
    }): void => {
      // network.jsonl is the same shared, append-only, per-instance shape as console.jsonl above —
      // every call re-stages the FULL accumulated content across every run set up so far.
      networkLinesByRun.set(runId, lines);
      const content = [...networkLinesByRun.entries()]
        .flatMap(([taggedRunId, taggedLines]) =>
          taggedLines.map(
            (text) =>
              `${JSON.stringify({ runId: taggedRunId, step: null, atMs: FIXTURE_AT_MS, text })}\n`,
          ),
        )
        .join('');
      resultsProxy.setupBuffer({ evidencePath, kind: 'network', content });
    },

    setupStepReadings: ({
      evidencePath,
      runId,
      readings,
    }: {
      evidencePath: AbsoluteFilePath;
      runId: RunId;
      readings: readonly StepReading[];
    }): void => {
      // A run's transcript is its own file, never shared across runs the way the console/network
      // buffers above are — so, unlike `setupConsoleLines`/`setupNetworkLines`, this replaces the
      // whole file each call rather than accumulating across runs.
      const content = readings.map((reading) => `${JSON.stringify(reading)}\n`).join('');
      resultsProxy.setupTranscript({ evidencePath, runId, content });
    },
  };
};
