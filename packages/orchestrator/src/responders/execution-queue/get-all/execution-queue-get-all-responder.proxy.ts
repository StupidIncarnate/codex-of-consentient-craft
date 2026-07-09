import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';

import { questActiveQuestsBrokerProxy } from '../../../brokers/quest/active-quests/quest-active-quests-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const ExecutionQueueGetAllResponderProxy = (): {
  setupActiveQuests: (params: {
    guildItems: readonly GuildListItem[];
    questsByGuildId: readonly { guildId: GuildListItem['id']; quests: readonly Quest[] }[];
  }) => void;
  setupNoGuilds: () => void;
} => {
  const activeQuestsProxy = questActiveQuestsBrokerProxy();

  return {
    setupActiveQuests: activeQuestsProxy.setupGuildsAndQuests,
    setupNoGuilds: activeQuestsProxy.setupNoGuilds,
  };
};
