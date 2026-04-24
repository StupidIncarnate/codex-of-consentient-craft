import type { QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const toolingRunSmoketestBrokerProxy = (): {
  setupSuccess: (params: { enqueued: readonly { questId: QuestId; guildSlug: UrlSlug }[] }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.toolingSmoketestRun,
  });

  return {
    setupSuccess: ({ enqueued }) => {
      endpoint.resolves({ data: { enqueued } });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
