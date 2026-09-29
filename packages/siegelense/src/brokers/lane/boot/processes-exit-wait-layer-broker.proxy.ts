// PURPOSE: Proxy for processes-exit-wait-layer-broker — stages each group's liveness probe and
// makes the poll delay resolve at once, so a multi-poll wait costs no real time.
// USAGE: const proxy = processesExitWaitLayerBrokerProxy(); proxy.setupAliveForProbesThenGone({ pgid, aliveProbes: 1 });

import { asyncDelayAdapterProxy } from '../../../adapters/async/delay/async-delay-adapter.proxy';
import { processIsAliveAdapterProxy } from '../../../adapters/process/is-alive/process-is-alive-adapter.proxy';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

export const processesExitWaitLayerBrokerProxy = (): {
  setupGone: (params: { pgid: ProcessGroupId }) => void;
  setupAlive: (params: { pgid: ProcessGroupId }) => void;
  setupAliveForProbesThenGone: (params: { pgid: ProcessGroupId; aliveProbes: number }) => void;
  getRequestedDelay: () => unknown;
} => {
  const aliveProxy = processIsAliveAdapterProxy();
  const delayProxy = asyncDelayAdapterProxy();

  return {
    setupGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },

    setupAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
    },

    setupAliveForProbesThenGone: ({
      pgid,
      aliveProbes,
    }: {
      pgid: ProcessGroupId;
      aliveProbes: number;
    }): void => {
      aliveProxy.setupAliveForProbesThenGone({ pgid, aliveProbes });
    },

    getRequestedDelay: (): unknown => delayProxy.getRequestedDelay(),
  };
};
