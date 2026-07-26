import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const HookSubagentStopResponderProxy = (): {
  setupTranscript: (params: { filePath: FilePath; contents: string }) => void;
  setupReadError: (params: { filePath: FilePath }) => void;
} => {
  const fsReadProxy = fsReadFileAdapterProxy();

  return {
    setupTranscript: ({ filePath, contents }: { filePath: FilePath; contents: string }): void => {
      fsReadProxy.returns({ filePath, contents: FileContentsStub({ value: contents }) });
    },
    setupReadError: ({ filePath }: { filePath: FilePath }): void => {
      fsReadProxy.throws({ filePath, error: new Error('read failed') });
    },
  };
};
