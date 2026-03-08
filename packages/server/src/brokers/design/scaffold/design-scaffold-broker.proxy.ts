import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const designScaffoldBrokerProxy = (): {
  setupWriteError: (params: { error: Error }) => void;
} => {
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupWriteError: ({ error }: { error: Error }): void => {
      writeProxy.throws({ error });
    },
  };
};
