import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';

import type { GuildStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';

type Guild = ReturnType<typeof GuildStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const sessionResolveOwnerBrokerProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupQuestList: (params: { quests: QuestListItem[] }) => void;
  setupGetQuest: (params: { result: GetQuestResult }) => void;
  setupGetGuildThrows: (params: { error: Error }) => void;
} => {
  const getGuildProxy = orchestratorGetGuildAdapterProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const getQuestProxy = orchestratorGetQuestAdapterProxy();

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      getGuildProxy.returns({ guild });
    },
    setupQuestList: ({ quests }: { quests: QuestListItem[] }): void => {
      listQuestsProxy.returns({ quests });
    },
    setupGetQuest: ({ result }: { result: GetQuestResult }): void => {
      getQuestProxy.returns({ result });
    },
    setupGetGuildThrows: ({ error }: { error: Error }): void => {
      getGuildProxy.throws({ error });
    },
  };
};
