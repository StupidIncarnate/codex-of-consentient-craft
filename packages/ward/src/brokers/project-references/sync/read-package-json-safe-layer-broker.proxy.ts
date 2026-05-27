import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const readPackageJsonSafeLayerBrokerProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();

  return {
    returns: ({ content }: { content: string }): void => {
      readProxy.returns({ content });
    },
    throws: ({ error }: { error: Error }): void => {
      readProxy.throws({ error });
    },
  };
};
