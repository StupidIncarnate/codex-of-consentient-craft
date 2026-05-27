import { fsReadJsonSyncAdapterProxy } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter.proxy';

export const readTsconfigSafeLayerBrokerProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const jsonProxy = fsReadJsonSyncAdapterProxy();

  return {
    returns: ({ content }: { content: string }): void => {
      jsonProxy.returns({ content });
    },
    throws: ({ error }: { error: Error }): void => {
      jsonProxy.throws({ error });
    },
  };
};
