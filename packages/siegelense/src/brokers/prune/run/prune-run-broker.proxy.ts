import { registerMock } from '@dungeonmaster/testing/register-mock';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';
import { pruneInstanceReclaimBrokerProxy } from '../instance-reclaim/prune-instance-reclaim-broker.proxy';

type EpochMs = ReturnType<typeof EpochMsStub>;

const FIXED_NOW_MS = 1_700_000_000_000;

export const pruneRunBrokerProxy = (): {
  nowMs: () => EpochMs;
  setupRegistry: (params: { json: string }) => void;
} => {
  const readProxy = registryReadBrokerProxy();
  registryUpdateBrokerProxy();
  pruneInstanceReclaimBrokerProxy();

  // The broker stamps `nowMs` from the clock and every window and every `last beat Ns ago` is
  // measured off it, so a real clock would make each assertion drift by however long the suite
  // took to reach it.
  registerMock({ fn: Date.now }).calledWith([]).returns(FIXED_NOW_MS);

  return {
    nowMs: (): EpochMs => EpochMsStub({ value: FIXED_NOW_MS }),

    setupRegistry: ({ json }: { json: string }): void => {
      readProxy.setupPresentRegistry({ content: json });
    },
  };
};
