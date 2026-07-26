import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWriteGitignoreResponder } from './install-write-gitignore-responder';

export const InstallWriteGitignoreResponderProxy = (): {
  callResponder: typeof InstallWriteGitignoreResponder;
  setupReadFileContent: (params: { filePath: FilePath; content: string }) => void;
  setupReadFileThrows: (params: { filePath: FilePath }) => void;
  getWrittenContent: (params: { filePath: FilePath }) => unknown;
  getWrittenPath: () => unknown;
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

    getWrittenPath: (): unknown => writeProxy.getWrittenPath(),
  };
};
