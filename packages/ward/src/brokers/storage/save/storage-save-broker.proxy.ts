import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const storageSaveBrokerProxy = (): {
  setupSuccess: () => void;
  setupMkdirFail: (params: { error: Error }) => void;
  setupWriteFail: (params: { error: Error }) => void;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: (): void => {
      mkdirProxy.succeeds();
      writeProxy.succeeds();
    },
    setupMkdirFail: ({ error }: { error: Error }): void => {
      mkdirProxy.throws({ error });
    },
    setupWriteFail: ({ error }: { error: Error }): void => {
      mkdirProxy.succeeds();
      writeProxy.throws({ error });
    },
  };
};
