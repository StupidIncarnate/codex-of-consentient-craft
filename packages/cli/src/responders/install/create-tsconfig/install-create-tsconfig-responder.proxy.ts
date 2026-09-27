import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreateTsconfigResponder } from './install-create-tsconfig-responder';

export const InstallCreateTsconfigResponderProxy = (): {
  callResponder: typeof InstallCreateTsconfigResponder;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileNotExists: (params: { filePath: FilePath }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const existsProxy = existsSyncProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    callResponder: InstallCreateTsconfigResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: false });
      writeProxy.succeeds({ filePath });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
