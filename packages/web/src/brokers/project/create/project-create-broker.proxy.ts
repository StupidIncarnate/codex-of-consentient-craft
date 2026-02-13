import type { ProjectId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';

export const projectCreateBrokerProxy = (): {
  setupCreate: (params: { id: ProjectId }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchPostAdapterProxy();

  return {
    setupCreate: ({ id }: { id: ProjectId }): void => {
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
