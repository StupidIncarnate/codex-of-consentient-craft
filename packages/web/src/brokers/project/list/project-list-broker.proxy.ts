import type { ProjectListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';

export const projectListBrokerProxy = (): {
  setupProjects: (params: { projects: ProjectListItem[] }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchGetAdapterProxy();

  return {
    setupProjects: ({ projects }: { projects: ProjectListItem[] }): void => {
      fetchProxy.resolves({ data: projects });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      fetchProxy.resolves({ data });
    },
  };
};
