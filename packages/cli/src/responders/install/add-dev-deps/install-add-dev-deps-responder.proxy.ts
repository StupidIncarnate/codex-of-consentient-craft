import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { InstallAddDevDepsResponder } from './install-add-dev-deps-responder';

export const InstallAddDevDepsResponderProxy = (): {
  callResponder: typeof InstallAddDevDepsResponder;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileNotExists: (params: { filePath: FilePath }) => void;
  setupReadFile: (params: { filePath: FilePath; content: string }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const writtenPaths: FilePath[] = [];

  return {
    callResponder: InstallAddDevDepsResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: false });
    },

    setupReadFile: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      readProxy.returns({ path: filePath, contents: content });
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
