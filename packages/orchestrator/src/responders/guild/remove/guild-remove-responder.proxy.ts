import type { GuildConfig, GuildId, QuestStub } from '@dungeonmaster/shared/contracts';

import { guildRemoveBrokerProxy } from '../../../brokers/guild/remove/guild-remove-broker.proxy';
import { questListBrokerProxy } from '../../../brokers/quest/list/quest-list-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { GuildRemoveResponder } from './guild-remove-responder';

type Quest = ReturnType<typeof QuestStub>;

export const GuildRemoveResponderProxy = (): {
  callResponder: typeof GuildRemoveResponder;
  setupConfig: (params: { config: GuildConfig }) => void;
  setupQuestList: (params: { guildId: GuildId; quests: readonly Quest[] }) => void;
} => {
  const brokerProxy = guildRemoveBrokerProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();
  const queueProxy = questExecutionQueueStateProxy();
  queueProxy.setupEmpty();
  const listProxy = questListBrokerProxy();

  return {
    callResponder: GuildRemoveResponder,

    setupConfig: ({ config }: { config: GuildConfig }): void => {
      brokerProxy.setupConfig({ config });
    },

    setupQuestList: ({ guildId, quests }: { guildId: GuildId; quests: readonly Quest[] }): void => {
      listProxy.setupDirectList({ guildId, quests });
    },
  };
};
