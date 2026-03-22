import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const wardPersistResultBrokerProxy = (): {
  setupSuccess: () => void;
  setupWriteFailure: (params: { error: Error }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
} => {
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: (): void => {
      writeProxy.succeeds();
    },

    setupWriteFailure: ({ error }: { error: Error }): void => {
      writeProxy.throws({ error });
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),

    getWrittenPath: (): unknown => writeProxy.getWrittenPath(),
  };
};
