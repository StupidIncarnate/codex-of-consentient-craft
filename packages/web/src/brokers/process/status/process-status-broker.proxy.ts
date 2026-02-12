import type { OrchestrationStatus } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';

export const processStatusBrokerProxy = (): {
  setupStatus: (params: { status: OrchestrationStatus }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const fetchProxy = fetchGetAdapterProxy();

  return {
    setupStatus: ({ status }: { status: OrchestrationStatus }): void => {
      fetchProxy.resolves({ data: status });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
  };
};
