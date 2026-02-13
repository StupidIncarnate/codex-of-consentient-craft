// PURPOSE: Proxy for quest-list-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { QuestListItem } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questListBrokerProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.quests,
  });

  return {
    setupQuests: ({ quests }) => {
      endpoint.resolves({ data: quests });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
  };
};
