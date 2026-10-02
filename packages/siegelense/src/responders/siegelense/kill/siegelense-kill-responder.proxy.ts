/**
 * PURPOSE: Test proxy for SiegelenseKillResponder — mocks `registryReadBroker` and
 * `instanceKillBroker` directly rather than composing either's own child proxies' staging,
 * matching `SiegelenseStatusResponderProxy`'s shape for the sibling command. Both brokers' own
 * `.proxy.ts` are still constructed (never addressed further) to satisfy
 * `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseKillResponderProxy();
 * proxy.stageRegistry({ registry });
 * proxy.stageKillResult({ result });
 */

import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { instanceKillBroker } from '../../../brokers/instance/kill/instance-kill-broker';
import { instanceKillBrokerProxy } from '../../../brokers/instance/kill/instance-kill-broker.proxy';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import type { KillResultStub } from '../../../contracts/kill-result/kill-result.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

// The directory the responder reads as where it runs; the repo root it hands down is this same path.
const CWD_VALUE = '/default/cwd';

type Registry = ReturnType<typeof RegistryStub>;
type KillResult = ReturnType<typeof KillResultStub>;

export const SiegelenseKillResponderProxy = (): {
  stageRegistry: (params: { registry: Registry }) => void;
  stageKillResult: (params: { result: KillResult }) => void;
  stageKillThrows: (params: { error: Error; instanceId: SiegeInstance['id'] }) => void;
  getStdoutWrites: () => unknown[];
  getKillCallsMatching: () => RecordedCalls;
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages both brokers directly
  // below, never through either's own setup methods.
  registryReadBrokerProxy();
  instanceKillBrokerProxy();

  const cwdStagingProxy = cwdProxy();
  cwdStagingProxy.setupCwd({ value: CWD_VALUE });
  const resolveProxy = cwdResolveBrokerProxy();
  resolveProxy.setupRepoRootFoundAtStart({ startPath: CWD_VALUE });
  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const instanceKillHandle = registerMock({ fn: instanceKillBroker });
  const stdout = stdoutProxy();

  return {
    stageRegistry: ({ registry }: { registry: Registry }): void => {
      registryReadHandle.calledWith([]).resolves(registry);
    },

    stageKillResult: ({ result }: { result: KillResult }): void => {
      instanceKillHandle
        .calledWith([{ instanceId: result.instanceId, repoRoot: CWD_VALUE }])
        .resolves(result);
    },

    stageKillThrows: ({
      error,
      instanceId,
    }: {
      error: Error;
      instanceId: SiegeInstance['id'];
    }): void => {
      instanceKillHandle.calledWith([{ instanceId, repoRoot: CWD_VALUE }]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],

    getKillCallsMatching: (): RecordedCalls => instanceKillHandle.callsMatching([]),
  };
};
