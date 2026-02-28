import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { InstallCreateSettingsResponder } from './install-create-settings-responder';

export const InstallCreateSettingsResponderProxy = (): {
  callResponder: typeof InstallCreateSettingsResponder;
  setupNoExistingSettings: () => void;
  setupExistingSettings: (params: { content: ReturnType<typeof FileContentsStub> }) => void;
  getWrittenContent: () => unknown;
} => {
  pathJoinAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallCreateSettingsResponder,

    setupNoExistingSettings: (): void => {
      readProxy.throws({ error: new Error('ENOENT: no such file or directory') });
    },

    setupExistingSettings: ({
      content,
    }: {
      content: ReturnType<typeof FileContentsStub>;
    }): void => {
      readProxy.returns({ contents: content });
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),
  };
};
