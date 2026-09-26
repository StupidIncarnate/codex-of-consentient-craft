import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const readPackageNameOptionalLayerBrokerProxy = (): {
  setupPackageJson: (params: { packageJsonPath: FilePath; name: string }) => void;
  setupMissing: (params: { packageJsonPath: FilePath }) => void;
  setupPermissionDenied: (params: { packageJsonPath: FilePath }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupPackageJson: ({
      packageJsonPath,
      name,
    }: {
      packageJsonPath: FilePath;
      name: string;
    }): void => {
      fsProxy.returns({ filePath: packageJsonPath, content: JSON.stringify({ name }) });
    },
    setupMissing: ({ packageJsonPath }: { packageJsonPath: FilePath }): void => {
      fsProxy.throws({
        filePath: packageJsonPath,
        error: Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
      });
    },
    setupPermissionDenied: ({ packageJsonPath }: { packageJsonPath: FilePath }): void => {
      fsProxy.throws({
        filePath: packageJsonPath,
        error: Object.assign(new Error('EACCES'), { code: 'EACCES' }),
      });
    },
  };
};
