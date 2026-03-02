import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWriteGitignoreResponder } from './install-write-gitignore-responder';

export const InstallWriteGitignoreResponderProxy = (): {
  callResponder: typeof InstallWriteGitignoreResponder;
  setupReadFileContent: (params: { content: string }) => void;
  setupReadFileThrows: () => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
} => {
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallWriteGitignoreResponder,

    setupReadFileContent: ({ content }: { content: string }): void => {
      readProxy.returns({ content });
    },

    setupReadFileThrows: (): void => {
      readProxy.throws({ error: new Error('ENOENT: no such file or directory') });
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),

    getWrittenPath: (): unknown => writeProxy.getWrittenPath(),
  };
};
