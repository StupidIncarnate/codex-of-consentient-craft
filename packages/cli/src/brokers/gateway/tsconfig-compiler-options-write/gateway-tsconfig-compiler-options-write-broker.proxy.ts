import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const gatewayTsconfigCompilerOptionsWriteBrokerProxy = (): {
  setupMissingFile: (params: { tsconfigPath: string }) => void;
  setupFileContent: (params: { tsconfigPath: string; content: string }) => void;
  getWrittenContent: (params: { tsconfigPath: string }) => unknown;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();
  // tsconfigCompilerOptionsLocateTransformer is a pure transformer — it runs real in tests and
  // needs no child-proxy composition, the same as tsconfigCompilerOptionsSetTextTransformer below.

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
