import type { GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildRemoveBrokerProxy } from '../../../brokers/guild/remove/guild-remove-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { GuildRemoveResponder } from './guild-remove-responder';

export const GuildRemoveResponderProxy = (): {
  callResponder: typeof GuildRemoveResponder;
  setupConfig: (params: { config: GuildConfig }) => void;
} => {
  const brokerProxy = guildRemoveBrokerProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();
  const queueProxy = questExecutionQueueStateProxy();
  queueProxy.setupEmpty();

  return {
    callResponder: GuildRemoveResponder,

    setupConfig: ({ config }: { config: GuildConfig }): void => {
      brokerProxy.setupConfig({ config });
    },
  };
};
