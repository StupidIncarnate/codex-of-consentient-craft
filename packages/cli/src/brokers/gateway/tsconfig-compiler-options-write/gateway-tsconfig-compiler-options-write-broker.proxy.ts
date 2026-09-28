import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { typescriptTsconfigCompilerOptionsLocateAdapterProxy } from '../../../adapters/typescript/tsconfig-compiler-options-locate/typescript-tsconfig-compiler-options-locate-adapter.proxy';

export const gatewayTsconfigCompilerOptionsWriteBrokerProxy = (): {
  setupMissingFile: (params: { tsconfigPath: FilePath }) => void;
  setupFileContent: (params: { tsconfigPath: FilePath; content: string }) => void;
  getWrittenContent: (params: { tsconfigPath: FilePath }) => unknown;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();
  // Empty proxy: the real TypeScript JSON parse runs for real. Called only to satisfy
  // enforce-proxy-child-creation.
  typescriptTsconfigCompilerOptionsLocateAdapterProxy();

  return {
    setupMissingFile: ({ tsconfigPath }): void => {
      existsProxy.returns({ path: tsconfigPath, exists: false });
    },

    setupFileContent: ({ tsconfigPath, content }): void => {
      existsProxy.returns({ path: tsconfigPath, exists: true });
      readProxy.returns({ path: tsconfigPath, contents: content });
      writeProxy.succeeds({ path: tsconfigPath });
    },

    getWrittenContent: ({ tsconfigPath }): unknown =>
      writeProxy.writtenContentsFor({ path: tsconfigPath }),
  };
};
