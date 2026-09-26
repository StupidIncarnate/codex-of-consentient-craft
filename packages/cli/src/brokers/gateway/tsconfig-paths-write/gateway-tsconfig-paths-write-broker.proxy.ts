import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { typescriptTsconfigPathsLocateAdapterProxy } from '../../../adapters/typescript/tsconfig-paths-locate/typescript-tsconfig-paths-locate-adapter.proxy';

export const gatewayTsconfigPathsWriteBrokerProxy = (): {
  setupMissingFile: (params: { tsconfigPath: FilePath }) => void;
  setupFileContent: (params: { tsconfigPath: FilePath; content: string }) => void;
  getWrittenContent: (params: { tsconfigPath: FilePath }) => unknown;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  // Empty proxy: the real TypeScript JSON parse runs for real, the same reason ESLint/SQL adapters
  // run real rather than mocked. Called only to satisfy enforce-proxy-child-creation.
  typescriptTsconfigPathsLocateAdapterProxy();

  return {
    setupMissingFile: ({ tsconfigPath }): void => {
      existsProxy.returns({ filePath: tsconfigPath, result: false });
    },

    setupFileContent: ({ tsconfigPath, content }): void => {
      existsProxy.returns({ filePath: tsconfigPath, result: true });
      readProxy.resolves({ filePath: tsconfigPath, content });
      writeProxy.succeeds({ filePath: tsconfigPath });
    },

    getWrittenContent: ({ tsconfigPath }): unknown =>
      writeProxy.getWrittenFor({ filePath: tsconfigPath }),
  };
};
