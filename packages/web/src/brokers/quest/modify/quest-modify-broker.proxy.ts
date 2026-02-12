import type { Quest } from '@dungeonmaster/shared/contracts';

import { fetchPatchAdapterProxy } from '../../../adapters/fetch/patch/fetch-patch-adapter.proxy';

export const questModifyBrokerProxy = (): {
  setupModify: (params: { quest: Quest }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchPatchAdapterProxy();

  return {
    setupModify: ({ quest }: { quest: Quest }): void => {
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
