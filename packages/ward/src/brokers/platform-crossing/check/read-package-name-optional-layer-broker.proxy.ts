import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const readPackageNameOptionalLayerBrokerProxy = (): {
  setupPackageJson: (params: { packageJsonPath: FilePath; name: string }) => void;
  setupMissing: (params: { packageJsonPath: FilePath }) => void;
  setupPermissionDenied: (params: { packageJsonPath: FilePath }) => void;
} => {
  const fsProxy = readFileProxy();

  return {
    setupPackageJson: ({
      packageJsonPath,
      name,
    }: {
      packageJsonPath: FilePath;
      name: string;
    }): void => {
      fsProxy.returns({ path: packageJsonPath, contents: JSON.stringify({ name }) });
    },
    setupMissing: ({ packageJsonPath }: { packageJsonPath: FilePath }): void => {
      fsProxy.missing({ path: packageJsonPath });
    },
    setupPermissionDenied: ({ packageJsonPath }: { packageJsonPath: FilePath }): void => {
      fsProxy.denied({ path: packageJsonPath });
    },
  };
};
