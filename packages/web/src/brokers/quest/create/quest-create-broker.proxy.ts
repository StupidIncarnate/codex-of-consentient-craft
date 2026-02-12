import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';

export const questCreateBrokerProxy = (): {
  setupCreate: (params: { id: QuestId }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchPostAdapterProxy();

  return {
    setupCreate: ({ id }: { id: QuestId }): void => {
      fetchProxy.resolves({ data: { id } });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      fetchProxy.resolves({ data });
    },
  };
};
