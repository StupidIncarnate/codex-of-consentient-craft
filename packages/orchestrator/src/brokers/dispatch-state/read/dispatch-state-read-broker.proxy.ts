import { locationsDispatchStatePathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/dispatch-state-path-find/locations-dispatch-state-path-find-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const dispatchStateReadBrokerProxy = (): {
  setupStateFile: (params: { json: string }) => void;
  setupMissingFile: () => void;
  setupCorruptFile: () => void;
} => {
  const pathProxy = locationsDispatchStatePathFindBrokerProxy();
  const readFileHandle = readFileProxy();

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
      readFileHandle.returns({ path: dispatchStatePath, contents: json });
    },

    setupMissingFile: (): void => {
      queuePath();
      readFileHandle.missing({ path: dispatchStatePath });
    },

    setupCorruptFile: (): void => {
      queuePath();
      readFileHandle.returns({ path: dispatchStatePath, contents: 'not-valid-json{{{' });
    },
  };
};
