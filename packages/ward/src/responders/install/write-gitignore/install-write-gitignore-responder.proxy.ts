import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWriteGitignoreResponder } from './install-write-gitignore-responder';

export const InstallWriteGitignoreResponderProxy = (): {
  callResponder: typeof InstallWriteGitignoreResponder;
  setupReadFileContent: (params: { filePath: FilePath; content: string }) => void;
  setupReadFileThrows: (params: { filePath: FilePath }) => void;
  getWrittenContent: (params: { filePath: FilePath }) => unknown;
  getWrittenPath: (params: { filePath: FilePath }) => unknown;
} => {
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallWriteGitignoreResponder,

    setupReadFileContent: ({
      filePath,
      content,
    }: {
      filePath: FilePath;
      content: string;
    }): void => {
      readProxy.returns({ filePath, content });
      writeProxy.succeeds({ filePath });
    },

    setupReadFileThrows: ({ filePath }: { filePath: FilePath }): void => {
      readProxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });
      writeProxy.succeeds({ filePath });
    },

    getWrittenContent: ({ filePath }: { filePath: FilePath }): unknown =>
      writeProxy.getWrittenContent({ filePath }),

    // Trivial echo of the known address — the write having actually landed there is proven by
    // getWrittenContent returning a value; a caller that only wants the path back doesn't need
    // to re-derive it (matches quest-persist-broker.proxy.ts's same idiom).
    getWrittenPath: ({ filePath }: { filePath: FilePath }): unknown => filePath,
  };
};
