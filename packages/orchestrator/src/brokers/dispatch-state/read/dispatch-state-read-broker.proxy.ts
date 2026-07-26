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
  // heartbeat read-modify-write) stay aligned with the once-value mock queues. The resolved
  // path is always this same literal — dispatchStatePath below — so the read's filePath
  // address is that same literal too.
  const dispatchStatePath = FilePathStub({
    value: '/home/user/.dungeonmaster/dispatch-state.json',
  });
  const queuePath = (): void => {
    pathProxy.setupDispatchStatePath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      dispatchStatePath,
    });
  };

  return {
    setupStateFile: ({ json }: { json: string }): void => {
      queuePath();
      readFileProxy.resolves({ filePath: dispatchStatePath, content: json });
    },

    setupMissingFile: (): void => {
      queuePath();
      readFileProxy.rejects({
        filePath: dispatchStatePath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },

    setupCorruptFile: (): void => {
      queuePath();
      readFileProxy.resolves({ filePath: dispatchStatePath, content: 'not-valid-json{{{' });
    },
  };
};
