// PURPOSE: Proxy for processes-stop-layer-broker — stages, per group, how it answers the liveness
// probes and signals a stop sequence sends, and stages the clock only for a scenario that has to
// run a wait out to its deadline, so no scenario sleeps for real.
// USAGE: const proxy = processesStopLayerBrokerProxy(); proxy.setupExitsOnSigterm({ pgid });

import { nowProxy } from '#gateway/node/Date/now/now.proxy';

import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';
import { processKillGroupBrokerProxy } from '../../process/kill-group/process-kill-group-broker.proxy';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { processesExitWaitLayerBrokerProxy } from './processes-exit-wait-layer-broker.proxy';

type ProcessGroupId = number;

const GRACE_ENDS_MS = driverStatics.teardown.graceMs;
const KILL_WAIT_ENDS_MS = driverStatics.teardown.graceMs + driverStatics.teardown.killWaitMs;

export const processesStopLayerBrokerProxy = (): {
  setupAlreadyGone: (params: { pgid: ProcessGroupId }) => void;
  setupExitsOnSigterm: (params: { pgid: ProcessGroupId }) => void;
  setupExitsOnlyOnSigkill: (params: { pgid: ProcessGroupId }) => void;
  setupSurvivesSigkill: (params: { pgid: ProcessGroupId }) => void;
  getSignalsFor: (params: { pgid: ProcessGroupId }) => readonly unknown[];
} => {
  const aliveProxy = processIsAliveBrokerProxy();
  const killProxy = processKillGroupBrokerProxy();
  const exitWaitProxy = processesExitWaitLayerBrokerProxy();
  const clockProxy = nowProxy();

  return {
    setupAlreadyGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },

    // Probes: the up-front liveness filter sees it alive, the first exit-wait poll sees it gone.
    setupExitsOnSigterm: ({ pgid }: { pgid: ProcessGroupId }): void => {
      exitWaitProxy.setupAliveThenGone({ pgid });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
    },

    // Alive on every probe until SIGKILL lands, gone after it. Clock: the grace deadline is computed at 0 and the
    // grace wait's check reads its end, so it gives up after one poll; the kill wait then starts.
    setupExitsOnlyOnSigkill: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
      killProxy.setupSent({
        pgid,
        signal: 'SIGKILL',
        onSent: (): void => {
          aliveProxy.setupGone({ pgid });
        },
      });
      clockProxy.setupNowOnce({ ms: 0 });
      clockProxy.setupNow({ ms: GRACE_ENDS_MS });
    },

    // Alive on every probe. Clock: grace deadline at 0, grace check at its end, kill deadline from
    // there, and every later read past the kill deadline — each wait gives up after one poll.
    setupSurvivesSigkill: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
      killProxy.setupSent({ pgid, signal: 'SIGTERM' });
      killProxy.setupSent({ pgid, signal: 'SIGKILL' });
      clockProxy.setupNowOnce({ ms: 0 });
      clockProxy.setupNowOnce({ ms: GRACE_ENDS_MS });
      clockProxy.setupNowOnce({ ms: GRACE_ENDS_MS });
      clockProxy.setupNow({ ms: KILL_WAIT_ENDS_MS });
    },

    getSignalsFor: ({ pgid }: { pgid: ProcessGroupId }): readonly unknown[] =>
      killProxy.getCallsFor({ pgid }),
  };
};
