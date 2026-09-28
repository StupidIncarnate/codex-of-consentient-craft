import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { InstallCreateTsconfigResponder } from './install-create-tsconfig-responder';

export const InstallCreateTsconfigResponderProxy = (): {
  callResponder: typeof InstallCreateTsconfigResponder;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileNotExists: (params: { filePath: FilePath }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const existsProxy = existsSyncProxy();
  const writeProxy = writeFileProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const writtenPaths: FilePath[] = [];

  return {
    callResponder: InstallCreateTsconfigResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: false });
      writeProxy.succeeds({ path: filePath });
      writtenPaths.push(filePath);
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writtenPaths.flatMap((path) => {
        const content = writeProxy.writtenContentsFor({ path });
        return content === undefined ? [] : [{ path, content }];
      }),
  };
};
