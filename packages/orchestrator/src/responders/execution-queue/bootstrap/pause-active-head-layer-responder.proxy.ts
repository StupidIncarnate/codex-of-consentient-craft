import type { questPauseBroker } from '../../../brokers/quest/pause/quest-pause-broker';
import { questPauseBrokerProxy } from '../../../brokers/quest/pause/quest-pause-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';

type PauseArgs = Parameters<typeof questPauseBroker>[0];

export const PauseActiveHeadLayerResponderProxy = (): {
  setupPaused: () => void;
  setupNotPaused: () => void;
  getPauseBrokerCalls: () => readonly PauseArgs[];
} => {
  const pauseProxy = questPauseBrokerProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();

  return {
    setupPaused: (): void => {
      pauseProxy.setupPaused();
    },
    setupNotPaused: (): void => {
      pauseProxy.setupNotPaused();
    },
    getPauseBrokerCalls: (): readonly PauseArgs[] => {
      const raw = pauseProxy.getCallArgs();
      return raw.map((callArgs) => callArgs[0] as PauseArgs);
    },
  };
};
