/**
 * PURPOSE: Test proxy for SiegelenseSnapshotsResponder — mocks `registryReadBroker` and
 * `snapshotListBroker` directly rather than composing either's own child proxies' staging, matching
 * `SiegelenseKillResponderProxy`'s shape for the registry-miss check. `snapshotListBrokerProxy` is
 * still constructed (never addressed further) to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseSnapshotsResponderProxy();
 * proxy.stageRegistry({ registry });
 * proxy.stageAnswer({ answer });
 */

import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import { snapshotListBroker } from '../../../brokers/snapshot/list/snapshot-list-broker';
import { snapshotListBrokerProxy } from '../../../brokers/snapshot/list/snapshot-list-broker.proxy';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { SnapshotsAnswerStub } from '../../../contracts/snapshots-answer/snapshots-answer.stub';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

type SnapshotsAnswer = ReturnType<typeof SnapshotsAnswerStub>;
type Registry = ReturnType<typeof RegistryStub>;

export const SiegelenseSnapshotsResponderProxy = (): {
  stageRegistry: (params: { registry: Registry }) => void;
  stageAnswer: (params: { answer: SnapshotsAnswer }) => void;
  stageError: (params: { error: Error; instanceId: SiegeInstance['id'] }) => void;
  stageNow: (params: { nowMs: EpochMs }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages snapshotListBroker
  // directly below, never through its own setup methods.
  snapshotListBrokerProxy();
  registryReadBrokerProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const listHandle = registerMock({ fn: snapshotListBroker });
  const nowHandle = registerSpyOn({ object: Date, method: 'now' });
  nowHandle.calledWith([]).returns(0);

  const stdout = stdoutProxy();

  return {
    stageRegistry: ({ registry }: { registry: Registry }): void => {
      registryReadHandle.calledWith([]).resolves(registry);
    },

    stageAnswer: ({ answer }: { answer: SnapshotsAnswer }): void => {
      listHandle.calledWith([{ instanceId: answer.instanceId }]).resolves(answer);
    },

    stageError: ({ error, instanceId }: { error: Error; instanceId: SiegeInstance['id'] }): void => {
      listHandle.calledWith([{ instanceId }]).rejects(error);
    },

    stageNow: ({ nowMs }: { nowMs: EpochMs }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],
  };
};
