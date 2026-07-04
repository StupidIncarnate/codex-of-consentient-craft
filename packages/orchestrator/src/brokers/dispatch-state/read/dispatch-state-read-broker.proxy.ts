import { locationsDispatchStatePathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const dispatchStateReadBrokerProxy = (): {
  setupStateFile: (params: { json: string }) => void;
  setupMissingFile: () => void;
  setupCorruptFile: () => void;
} => {
  const pathProxy = locationsDispatchStatePathFindBrokerProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  // Each setup queues one path-resolution chain + one read, so multi-read flows (e.g. the
  // heartbeat read-modify-write) stay aligned with the once-value mock queues.
  const queuePath = (): void => {
    pathProxy.setupDispatchStatePath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      dispatchStatePath: FilePathStub({ value: '/home/user/.dungeonmaster/dispatch-state.json' }),
    });
  };

  return {
    setupStateFile: ({ json }: { json: string }): void => {
      queuePath();
      readFileProxy.resolves({ content: json });
    },

    setupMissingFile: (): void => {
      queuePath();
      readFileProxy.rejects({ error: new Error('ENOENT: no such file or directory') });
    },

    setupCorruptFile: (): void => {
      queuePath();
      readFileProxy.resolves({ content: 'not-valid-json{{{' });
    },
  };
};
