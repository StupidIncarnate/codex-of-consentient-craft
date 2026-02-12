import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';

import type { QuestListItem } from '@dungeonmaster/shared/contracts';

export const questListBrokerProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const fetchProxy = fetchGetAdapterProxy();

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      fetchProxy.resolves({ data: quests });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
  };
};
