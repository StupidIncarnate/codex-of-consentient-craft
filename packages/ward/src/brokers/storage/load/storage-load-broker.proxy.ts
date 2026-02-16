import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';

export const storageLoadBrokerProxy = (): {
  setupRunById: (params: { content: string }) => void;
  setupLatestRun: (params: { entries: string[]; content: string }) => void;
  setupEmptyDir: () => void;
  setupReadFail: (params: { error: Error }) => void;
  setupReaddirFail: (params: { error: Error }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();

  return {
    setupRunById: ({ content }: { content: string }): void => {
      readFileProxy.returns({ content });
    },
    setupLatestRun: ({ entries, content }: { entries: string[]; content: string }): void => {
      readdirProxy.returns({ entries });
      readFileProxy.returns({ content });
    },
    setupEmptyDir: (): void => {
      readdirProxy.returns({ entries: [] });
    },
    setupReadFail: ({ error }: { error: Error }): void => {
      readFileProxy.throws({ error });
    },
    setupReaddirFail: ({ error }: { error: Error }): void => {
      readdirProxy.throws({ error });
    },
  };
};
