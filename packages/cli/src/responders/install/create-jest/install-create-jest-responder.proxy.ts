import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { InstallCreateJestResponder } from './install-create-jest-responder';

export const InstallCreateJestResponderProxy = (): {
  callResponder: typeof InstallCreateJestResponder;
  setupFileExists: (params: { filePath: string }) => void;
  setupFileNotExists: (params: { filePath: string }) => void;
  setupWorkspacesRoot: () => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const writtenPaths: string[] = [];

  const packageJsonPath = '/project/package.json';

  const markSinglePackage = (): void => {
    existsProxy.returns({ path: packageJsonPath, exists: false });
  };

  return {
    callResponder: InstallCreateJestResponder,

    setupFileExists: ({ filePath }: { filePath: string }): void => {
      markSinglePackage();
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: string }): void => {
      markSinglePackage();
      existsProxy.returns({ path: filePath, exists: false });
      writeProxy.succeeds({ path: filePath });
      writtenPaths.push(filePath);
    },

    setupWorkspacesRoot: (): void => {
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
      });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writtenPaths.flatMap((path) => {
        const content = writeProxy.writtenContentsFor({ path });
        return content === undefined ? [] : [{ path, content }];
      }),
  };
};
