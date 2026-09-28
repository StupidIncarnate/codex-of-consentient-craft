import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const workspaceManifestEntriesVerifyBrokerProxy = (): {
  setupManifest: (params: { manifestPath: FilePath; manifestJson: string }) => void;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileMissing: (params: { filePath: FilePath }) => void;
} => {
  const readProxy = readFileProxy();
  const statProxy = statIfExistsProxy();

  return {
    setupManifest: ({
      manifestPath,
      manifestJson,
    }: {
      manifestPath: FilePath;
      manifestJson: string;
    }): void => {
      readProxy.returns({ path: manifestPath, contents: manifestJson });
    },
    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      statProxy.returnsFile({ path: String(filePath), sizeBytes: 1024, modifiedAtMs: 0 });
    },
    setupFileMissing: ({ filePath }: { filePath: FilePath }): void => {
      statProxy.missing({ path: String(filePath) });
    },
  };
};
