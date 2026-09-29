// PURPOSE: Proxy for processes-stop-layer-broker — stages, per group, how it answers the liveness
// probes and signals a stop sequence sends, and stages the clock only for a scenario that has to
// run a wait out to its deadline, so no scenario sleeps for real.
// USAGE: const proxy = processesStopLayerBrokerProxy(); proxy.setupExitsOnSigterm({ pgid });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { processIsAliveAdapterProxy } from '../../../adapters/process/is-alive/process-is-alive-adapter.proxy';
import { processKillGroupAdapterProxy } from '../../../adapters/process/kill-group/process-kill-group-adapter.proxy';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { processesExitWaitLayerBrokerProxy } from './processes-exit-wait-layer-broker.proxy';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

const GRACE_ENDS_MS = driverStatics.teardown.graceMs;
const KILL_WAIT_ENDS_MS = driverStatics.teardown.graceMs + driverStatics.teardown.killWaitMs;

export const processesStopLayerBrokerProxy = (): {
  setupAlreadyGone: (params: { pgid: ProcessGroupId }) => void;
  setupExitsOnSigterm: (params: { pgid: ProcessGroupId }) => void;
  setupExitsOnlyOnSigkill: (params: { pgid: ProcessGroupId }) => void;
  setupSurvivesSigkill: (params: { pgid: ProcessGroupId }) => void;
  getSignalsFor: (params: { pgid: ProcessGroupId }) => readonly unknown[];
} => {
  const aliveProxy = processIsAliveAdapterProxy();
  const killProxy = processKillGroupAdapterProxy();
  processesExitWaitLayerBrokerProxy();

  return {
    setupAlreadyGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },

    // Probes: the up-front liveness filter sees it alive, the first exit-wait poll sees it gone.
    setupExitsOnSigterm: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAliveForProbesThenGone({ pgid, aliveProbes: 1 });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
    },

    // Probes: up-front filter, the grace wait's only poll, the pre-SIGKILL re-check — all alive —
    // then gone on the kill wait's first poll. Clock: the grace deadline is computed at 0 and the
    // grace wait's check reads its end, so it gives up after one poll; the kill wait then starts.
    setupExitsOnlyOnSigkill: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAliveForProbesThenGone({ pgid, aliveProbes: 3 });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
      killProxy.setupSent({ pgid, signal: 'SIGKILL' });
      const dateHandle = registerSpyOn({ object: Date, method: 'now' });
      dateHandle.onceFor([]).returns(0);
      dateHandle.calledWith([]).returns(GRACE_ENDS_MS);
    },

    // Alive on every probe. Clock: grace deadline at 0, grace check at its end, kill deadline from
    // there, and every later read past the kill deadline — each wait gives up after one poll.
    setupSurvivesSigkill: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
      killProxy.setupSent({ pgid, signal: 'SIGKILL' });
      const dateHandle = registerSpyOn({ object: Date, method: 'now' });
      dateHandle.onceFor([]).returns(0);
      dateHandle.onceFor([]).returns(GRACE_ENDS_MS);
      dateHandle.onceFor([]).returns(GRACE_ENDS_MS);
      dateHandle.calledWith([]).returns(KILL_WAIT_ENDS_MS);
    },

    // `process.kill` also carries the signal-0 liveness probes; strings are the signals actually sent.
    getSignalsFor: ({ pgid }: { pgid: ProcessGroupId }): readonly unknown[] =>
      killProxy.getCallsFor({ pgid }).filter((signal) => typeof signal === 'string'),
  };
};
