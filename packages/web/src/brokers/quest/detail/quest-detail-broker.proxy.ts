import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';

import type { Quest } from '@dungeonmaster/shared/contracts';

export const questDetailBrokerProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchGetAdapterProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      fetchProxy.resolves({ data: quest });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      fetchProxy.resolves({ data });
    },
  };
};
