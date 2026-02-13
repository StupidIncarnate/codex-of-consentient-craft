import { fetchDeleteAdapterProxy } from '../../../adapters/fetch/delete/fetch-delete-adapter.proxy';

export const projectRemoveBrokerProxy = (): {
  setupRemove: () => void;
  setupError: (params: { error: Error }) => void;
} => {
  const fetchProxy = fetchDeleteAdapterProxy();

  return {
    setupRemove: (): void => {
      fetchProxy.resolves({ data: {} });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
  };
};
