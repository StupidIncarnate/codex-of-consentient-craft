import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreateConfigResponder } from './install-create-config-responder';

export const InstallCreateConfigResponderProxy = (): {
  callResponder: typeof InstallCreateConfigResponder;
  setupConfigExists: () => void;
  setupConfigNotExists: () => void;
} => {
  pathJoinAdapterProxy();
  const accessProxy = fsAccessAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallCreateConfigResponder,

    setupConfigExists: (): void => {
      accessProxy.resolves();
    },

    setupConfigNotExists: (): void => {
      accessProxy.rejects({ error: new Error('ENOENT') });
      writeProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster' }),
        contents: FileContentsStub({ value: '{}' }),
      });
    },
  };
};
