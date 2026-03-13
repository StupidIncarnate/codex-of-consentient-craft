import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';

export const RecoverGuildLayerResponderProxy = (): {
  setupEmpty: () => void;
} => {
  guildGetBrokerProxy();
  questListBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  pathJoinAdapterProxy();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  return {
    setupEmpty: (): void => {
      // Default empty state
    },
  };
};
