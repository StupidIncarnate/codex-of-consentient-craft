import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const workspaceManifestEntriesVerifyBrokerProxy = (): {
  setupManifest: (params: { manifestPath: FilePath; manifestJson: string }) => void;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileMissing: (params: { filePath: FilePath }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();
  const statProxy = statIfExistsProxy();

  return {
    setupManifest: ({
      manifestPath,
      manifestJson,
    }: {
      manifestPath: FilePath;
      manifestJson: string;
    }): void => {
      readFileProxy.returns({ filePath: manifestPath, content: manifestJson });
    },
    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      statProxy.returnsFile({ path: String(filePath), sizeBytes: 1024, modifiedAtMs: 0 });
    },
    setupFileMissing: ({ filePath }: { filePath: FilePath }): void => {
      statProxy.missing({ path: String(filePath) });
    },
  };
};
