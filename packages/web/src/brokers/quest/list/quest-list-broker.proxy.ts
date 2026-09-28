// PURPOSE: Proxy for the broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { QuestListItem, SkippedQuestFile } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questListBrokerProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsWithSkips: (params: { quests: QuestListItem[]; skipped: SkippedQuestFile[] }) => void;
  setupError: () => void;
  setupEmptyBody: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.quests } as const;

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { quests, skipped: [] } });
    },
    setupQuestsWithSkips: ({
      quests,
      skipped,
    }: {
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { quests, skipped } });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    setupEmptyBody: (): void => {
      jsonFetchProxy.setupEmptyBody(address);
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: data });
    },
  };
};
