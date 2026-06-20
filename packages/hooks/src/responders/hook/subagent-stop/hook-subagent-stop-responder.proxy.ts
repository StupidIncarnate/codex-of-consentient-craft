import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const HookSubagentStopResponderProxy = (): {
  setupTranscript: (params: { contents: string }) => void;
  setupReadError: () => void;
} => {
  const fsReadProxy = fsReadFileAdapterProxy();

  return {
    setupTranscript: ({ contents }: { contents: string }): void => {
      fsReadProxy.returns({ contents: FileContentsStub({ value: contents }) });
    },
    setupReadError: (): void => {
      fsReadProxy.throws({ error: new Error('read failed') });
    },
  };
};
