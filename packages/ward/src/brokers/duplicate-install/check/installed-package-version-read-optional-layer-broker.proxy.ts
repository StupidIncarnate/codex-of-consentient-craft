import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const installedPackageVersionReadOptionalLayerBrokerProxy = (): {
  setupInstalled: (params: { packageJsonPath: FilePath; version: string }) => void;
  setupMissing: (params: { packageJsonPath: FilePath }) => void;
  setupPermissionDenied: (params: { packageJsonPath: FilePath }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupInstalled: ({
      packageJsonPath,
      version,
    }: {
      packageJsonPath: FilePath;
      version: string;
    }): void => {
      fsProxy.returns({ path: packageJsonPath, contents: JSON.stringify({ version }) });
    },
    setupMissing: ({ packageJsonPath }: { packageJsonPath: FilePath }): void => {
      fsProxy.missing({ path: packageJsonPath });
    },
    setupPermissionDenied: ({ packageJsonPath }: { packageJsonPath: FilePath }): void => {
      fsProxy.denied({ path: packageJsonPath });
    },
  };
};
