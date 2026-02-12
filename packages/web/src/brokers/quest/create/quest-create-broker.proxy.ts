import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';

export const questCreateBrokerProxy = (): {
  setupCreate: (params: { id: QuestId }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const fetchProxy = fetchPostAdapterProxy();

  return {
    setupCreate: ({ id }: { id: QuestId }): void => {
      fetchProxy.resolves({ data: { id } });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
  };
};
