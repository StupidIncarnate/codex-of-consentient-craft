import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { InstallWriteGitignoreResponder } from './install-write-gitignore-responder';

export const InstallWriteGitignoreResponderProxy = (): {
  callResponder: typeof InstallWriteGitignoreResponder;
  setupReadFileContent: (params: { filePath: FilePath; content: string }) => void;
  setupReadFileThrows: (params: { filePath: FilePath }) => void;
  getWrittenContent: (params: { filePath: FilePath }) => unknown;
  getWrittenPath: (params: { filePath: FilePath }) => unknown;
} => {
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();

  return {
    callResponder: InstallWriteGitignoreResponder,

    setupReadFileContent: ({
      filePath,
      content,
    }: {
      filePath: FilePath;
      content: string;
    }): void => {
      readProxy.returns({ path: filePath, contents: content });
      writeProxy.succeeds({ path: filePath });
    },

    setupReadFileThrows: ({ filePath }: { filePath: FilePath }): void => {
      readProxy.missing({ path: filePath });
      writeProxy.succeeds({ path: filePath });
    },

    getWrittenContent: ({ filePath }: { filePath: FilePath }): unknown =>
      writeProxy.writtenContentsFor({ path: filePath }),

    // Trivial echo of the known address — the write having actually landed there is proven by
    // getWrittenContent returning a value; a caller that only wants the path back doesn't need
    // to re-derive it (matches quest-persist-broker.proxy.ts's same idiom).
    getWrittenPath: ({ filePath }: { filePath: FilePath }): unknown => filePath,
  };
};
