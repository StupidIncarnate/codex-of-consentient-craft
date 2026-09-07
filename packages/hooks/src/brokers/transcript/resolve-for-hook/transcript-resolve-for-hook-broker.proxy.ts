import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const transcriptResolveForHookBrokerProxy = (): {
  setupExists: ({ path, exists }: { path: string; exists: boolean }) => void;
} => {
  const fsProxy = fsExistsSyncAdapterProxy();

  return {
    setupExists: ({ path, exists }: { path: string; exists: boolean }): void => {
      fsProxy.returns({ filePath: FilePathStub({ value: path }), exists });
    },
  };
};
