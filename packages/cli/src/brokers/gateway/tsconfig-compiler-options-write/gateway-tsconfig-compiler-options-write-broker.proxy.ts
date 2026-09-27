import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { typescriptTsconfigCompilerOptionsLocateAdapterProxy } from '../../../adapters/typescript/tsconfig-compiler-options-locate/typescript-tsconfig-compiler-options-locate-adapter.proxy';

export const gatewayTsconfigCompilerOptionsWriteBrokerProxy = (): {
  setupMissingFile: (params: { tsconfigPath: FilePath }) => void;
  setupFileContent: (params: { tsconfigPath: FilePath; content: string }) => void;
  getWrittenContent: (params: { tsconfigPath: FilePath }) => unknown;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  // Empty proxy: the real TypeScript JSON parse runs for real. Called only to satisfy
  // enforce-proxy-child-creation.
  typescriptTsconfigCompilerOptionsLocateAdapterProxy();

  return {
    setupMissingFile: ({ tsconfigPath }): void => {
      existsProxy.returns({ path: tsconfigPath, exists: false });
    },

    setupFileContent: ({ tsconfigPath, content }): void => {
      existsProxy.returns({ path: tsconfigPath, exists: true });
      readProxy.resolves({ filePath: tsconfigPath, content });
      writeProxy.succeeds({ filePath: tsconfigPath });
    },

    getWrittenContent: ({ tsconfigPath }): unknown =>
      writeProxy.getWrittenFor({ filePath: tsconfigPath }),
  };
};
