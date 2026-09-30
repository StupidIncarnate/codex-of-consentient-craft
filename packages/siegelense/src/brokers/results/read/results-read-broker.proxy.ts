import { homedir } from '#gateway/node/os';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { Guild, SiegeInstance, SiegeRun } from '@dungeonmaster/shared/contracts';

import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { instanceStateResolveBrokerProxy } from '../../instance/state-resolve/instance-state-resolve-broker.proxy';
import { locationsBufferPathsFindBrokerProxy } from '../../locations/buffer-paths-find/locations-buffer-paths-find-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRunPathsFindBrokerProxy } from '../../locations/run-paths-find/locations-run-paths-find-broker.proxy';
import { bufferReadLayerBrokerProxy } from './buffer-read-layer-broker.proxy';
import { runListLayerBrokerProxy } from './run-list-layer-broker.proxy';
import { runMissingCheckLayerBrokerProxy } from './run-missing-check-layer-broker.proxy';
import { serverWindowReadLayerBrokerProxy } from './server-window-read-layer-broker.proxy';
import { transcriptReadLayerBrokerProxy } from './transcript-read-layer-broker.proxy';

type Registry = ReturnType<typeof RegistryStub>;
type RunResult = ReturnType<typeof RunResultStub>;
type BufferKind = 'console' | 'network' | 'websocket';

// Matches registryReadBrokerProxy's own hardcoded queuePath() values (composed transitively via
// instanceStateResolveBrokerProxy below) — a fixed sticky root, real path.join everywhere else,
// never a one-shot pathJoinAdapter.returns() threaded across two unrelated resolvers. See
// instance-start-broker.proxy.ts's own comment for why: a one-shot queue shared across a dozen
// unrelated resolvers has no ordering guarantee the moment two callers interleave — every path
// below is computed by hand-concatenation, matching locationsRunPathsFindBroker/
// locationsBufferPathsFindBroker's own known suffixes, rather than by calling those real resolvers
// at TEST-SETUP time: a real call made before resultsReadBroker itself runs would consume the
// one-shots staged for instanceStateResolveBroker's OWN later resolution, computing garbage paths
// for the mocks this proxy stages instead of the real evidence-relative ones.
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';

export const resultsReadBrokerProxy = (): {
  evidencePathFor: (params: {
    instanceId: SiegeInstance['id'];
    guildId?: Guild['id'] | null;
  }) => string;
  setupRegistry: (params: { registry: Registry }) => void;
  setupNow: (params: { nowMs: number }) => void;
  setupRuns: (params: { evidencePath: string; entries: readonly string[] }) => void;
  setupTranscript: (params: {
    evidencePath: string;
    runId: SiegeRun['id'];
    content: string;
  }) => void;
  setupMissingTranscript: (params: { evidencePath: string; runId: SiegeRun['id'] }) => void;
  setupStoredReturn: (params: {
    evidencePath: string;
    runId: SiegeRun['id'];
    result: RunResult;
  }) => void;
  setupMissingStoredReturn: (params: { evidencePath: string; runId: SiegeRun['id'] }) => void;
  setupBuffer: (params: {
    evidencePath: string;
    kind: BufferKind;
    content: string;
  }) => void;
  setupServerLog: (params: { evidencePath: string; content: string }) => void;
} => {
  const instanceStateProxy = instanceStateResolveBrokerProxy();
  locationsInstanceEvidencePathFindBrokerProxy();
  locationsRunPathsFindBrokerProxy();
  locationsBufferPathsFindBrokerProxy();
  const runListProxy = runListLayerBrokerProxy();
  const transcriptProxy = transcriptReadLayerBrokerProxy();
  const bufferProxy = bufferReadLayerBrokerProxy();
  const serverWindowProxy = serverWindowReadLayerBrokerProxy();
  // The stored-return read is now the SAME `readFile` mock runMissingCheckLayerBroker probes, so
  // this composes THAT child proxy rather than fsReadFileAdapterProxy directly — matching
  // results-read-broker.ts's own import list, which enforce-proxy-child-creation checks.
  const storedReturnReadProxy = runMissingCheckLayerBrokerProxy();

  // Registered LAST, so it is the most recent `calledWith([])` registration on the shared
  // `homedir` mock and wins over whatever default any composed child proxy's own constructor
  // staged — see the ROOT_PATH_VALUE comment above.
  registerMock({ fn: homedir }).calledWith([]).returns('/home/user');

  return {
    evidencePathFor: ({
      instanceId,
      guildId = null,
    }: {
      instanceId: SiegeInstance['id'];
      guildId?: Guild['id'] | null;
    }): string => {
      const partition =
        guildId === null
          ? `unowned/instances/${instanceId}`
          : `guilds/${guildId}/instances/${instanceId}`;
      return `${ROOT_PATH_VALUE}/${partition}`;
    },

    setupRegistry: ({ registry }: { registry: Registry }): void => {
      instanceStateProxy.setupRegistry({ registry });
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      instanceStateProxy.setupNow({ nowMs });
    },

    setupRuns: ({
      evidencePath,
      entries,
    }: {
      evidencePath: string;
      entries: readonly string[];
    }): void => {
      runListProxy.setupRuns({ evidencePath, entries });
    },

    setupTranscript: ({
      evidencePath,
      runId,
      content,
    }: {
      evidencePath: string;
      runId: SiegeRun['id'];
      content: string;
    }): void => {
      const transcriptPath = `${evidencePath}/runs/${runId}.jsonl`;
      transcriptProxy.setupTranscript({ transcriptPath, content });
    },

    setupMissingTranscript: ({
      evidencePath,
      runId,
    }: {
      evidencePath: string;
      runId: SiegeRun['id'];
    }): void => {
      const transcriptPath = `${evidencePath}/runs/${runId}.jsonl`;
      transcriptProxy.setupMissingTranscript({ transcriptPath });
    },

    setupStoredReturn: ({
      evidencePath,
      runId,
      result,
    }: {
      evidencePath: string;
      runId: SiegeRun['id'];
      result: RunResult;
    }): void => {
      const storedReturnPath = `${evidencePath}/runs/${runId}.json`;
      storedReturnReadProxy.setupStoredReturn({
        storedReturnPath,
        content: JSON.stringify(result),
      });
    },

    setupMissingStoredReturn: ({
      evidencePath,
      runId,
    }: {
      evidencePath: string;
      runId: SiegeRun['id'];
    }): void => {
      const storedReturnPath = `${evidencePath}/runs/${runId}.json`;
      storedReturnReadProxy.setupMissingStoredReturn({ storedReturnPath });
    },

    setupBuffer: ({
      evidencePath,
      kind,
      content,
    }: {
      evidencePath: string;
      kind: BufferKind;
      content: string;
    }): void => {
      const suffix = kind === 'websocket' ? 'ws.jsonl' : `${kind}.jsonl`;
      const bufferPath = `${evidencePath}/${suffix}`;
      bufferProxy.setupBuffer({ bufferPath, content });
    },

    setupServerLog: ({
      evidencePath,
      content,
    }: {
      evidencePath: string;
      content: string;
    }): void => {
      serverWindowProxy.setupServerLog({ evidencePath, content });
    },
  };
};
