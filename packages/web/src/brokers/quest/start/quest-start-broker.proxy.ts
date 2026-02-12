import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';

export const questStartBrokerProxy = (): {
  setupStart: (params: { processId: ProcessId }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchPostAdapterProxy();

  return {
    setupStart: ({ processId }: { processId: ProcessId }): void => {
      fetchProxy.resolves({ data: { processId } });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      fetchProxy.resolves({ data });
    },
  };
};
