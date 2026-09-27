import { join, dirname } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath, PathSegment, FileContents } from '@dungeonmaster/shared/contracts';

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const packageScaffoldWriteBrokerProxy = (): {
  setupTargetMissing: (params: {
    packageRoot: FilePath;
    files: readonly { relativePath: PathSegment; contents: FileContents }[];
  }) => void;
  setupTargetExists: (params: { packageRoot: FilePath }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const existsProxy = existsSyncProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const realPath = requireActual<{ join: typeof join; dirname: typeof dirname }>({
    module: 'path',
  });
  const joinHandle = registerMock({ fn: join });
  const dirnameHandle = registerMock({ fn: dirname });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  dirnameHandle.calledWith([]).implement((path: never) => realPath.dirname(path));

  return {
    setupTargetMissing: ({ packageRoot, files }): void => {
      existsProxy.returns({ path: packageRoot, exists: false });

      for (const file of files) {
        const absolutePath = FilePathStub({ value: realPath.join(packageRoot, file.relativePath) });
        const parentDir = FilePathStub({ value: realPath.dirname(absolutePath) });

        joinHandle.calledWith([packageRoot, file.relativePath]).returns(absolutePath);
        dirnameHandle.calledWith([absolutePath]).returns(parentDir);

        mkdirProxy.succeeds({ filePath: parentDir });
        writeProxy.succeeds({ filePath: absolutePath });
      }
    },

    setupTargetExists: ({ packageRoot }): void => {
      existsProxy.returns({ path: packageRoot, exists: true });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
