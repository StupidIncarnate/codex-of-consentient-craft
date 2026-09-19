/**
 * PURPOSE: Test proxy for SiegelenseFleetResponder — mocks `registryReadBroker` and `Date.now`
 * directly rather than composing `registryReadBrokerProxy`'s own STAGING, since it already carries
 * its own dedicated test suite. That child proxy is still constructed (never addressed further) to
 * satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseFleetResponderProxy();
 * proxy.stageNow({ nowMs: EpochMsStub() });
 * proxy.stageInstances({ entries: [RegistryEntryStub()] });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';

export const SiegelenseFleetResponderProxy = (): {
  stageEmptyRegistry: () => void;
  stageInstances: (params: { entries: readonly RegistryEntry[] }) => void;
  stageNow: (params: { nowMs: EpochMs }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages registryReadBroker
  // directly below, never through this child's own setup methods.
  registryReadBrokerProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const nowHandle = registerSpyOn({ object: Date, method: 'now' });

  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageEmptyRegistry: (): void => {
      registryReadHandle.calledWith([]).resolves({ instances: [] });
    },

    stageInstances: ({ entries }: { entries: readonly RegistryEntry[] }): void => {
      registryReadHandle.calledWith([]).resolves({ instances: entries });
    },

    stageNow: ({ nowMs }: { nowMs: EpochMs }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
