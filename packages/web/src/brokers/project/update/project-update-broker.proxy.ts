import type { Project } from '@dungeonmaster/shared/contracts';

import { fetchPatchAdapterProxy } from '../../../adapters/fetch/patch/fetch-patch-adapter.proxy';

export const projectUpdateBrokerProxy = (): {
  setupUpdate: (params: { project: Project }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchPatchAdapterProxy();

  return {
    setupUpdate: ({ project }: { project: Project }): void => {
      fetchProxy.resolves({ data: project });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      fetchProxy.resolves({ data });
    },
  };
};
