import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const workspaceManifestEntriesVerifyBrokerProxy = (): {
  setupManifest: (params: { manifestPath: string; manifestJson: string }) => void;
  setupFileExists: (params: { filePath: string }) => void;
  setupFileMissing: (params: { filePath: string }) => void;
} => {
  const readProxy = readFileProxy();
  const statProxy = statIfExistsProxy();

  return {
    setupManifest: ({
      manifestPath,
      manifestJson,
    }: {
      manifestPath: string;
      manifestJson: string;
    }): void => {
      readProxy.returns({ path: manifestPath, contents: manifestJson });
    },
    setupFileExists: ({ filePath }: { filePath: string }): void => {
      statProxy.returnsFile({ path: String(filePath), sizeBytes: 1024, modifiedAtMs: 0 });
    },
    setupFileMissing: ({ filePath }: { filePath: string }): void => {
      statProxy.missing({ path: String(filePath) });
    },
  };
};
