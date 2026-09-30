// PURPOSE: Proxy for processes-exit-wait-layer-broker — stages each group's liveness probe and
// makes the poll delay fire at once, so a multi-poll wait costs no real time.
// USAGE: const proxy = processesExitWaitLayerBrokerProxy(); proxy.setupAliveThenGone({ pgid });

import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';

import { driverStatics } from '../../../statics/driver/driver-statics';
import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';

type ProcessGroupId = number;

// A fixed clock below every real deadline a test hands in and above the `0` deadline that means
// "already past".
const CLOCK_MS = 1_000;

export const processesExitWaitLayerBrokerProxy = (): {
  setupGone: (params: { pgid: ProcessGroupId }) => void;
  setupAlive: (params: { pgid: ProcessGroupId }) => void;
  setupAliveThenGone: (params: { pgid: ProcessGroupId }) => void;
  getRequestedDelays: () => readonly unknown[];
} => {
  const aliveProxy = processIsAliveBrokerProxy();
  const timeoutProxy = setTimeoutProxy();
  const clockProxy = nowProxy();
  clockProxy.setupNow({ ms: CLOCK_MS });
  timeoutProxy.setupFiresImmediately({ ms: driverStatics.teardown.exitPollMs });

  return {
    setupGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },

    setupAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
    },

    // Alive on the first probe, gone on the second: a group that exits while the wait polls.
    setupAliveThenGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAliveThenGone({ pgid });
    },

    getRequestedDelays: (): readonly unknown[] =>
      timeoutProxy.getCallsFor({ ms: driverStatics.teardown.exitPollMs }).map((call) => call[1]),
  };
};
