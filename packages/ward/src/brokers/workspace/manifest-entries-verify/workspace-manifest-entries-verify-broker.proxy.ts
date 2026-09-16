import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';

export const workspaceManifestEntriesVerifyBrokerProxy = (): {
  setupManifest: (params: { manifestPath: FilePath; manifestJson: string }) => void;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileMissing: (params: { filePath: FilePath }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();
  const statProxy = fsStatAdapterProxy();

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
      statProxy.returnsMtime({ filePath, mtimeMs: 0 });
    },
    setupFileMissing: ({ filePath }: { filePath: FilePath }): void => {
      statProxy.returnsNull({ filePath });
    },
  };
};
