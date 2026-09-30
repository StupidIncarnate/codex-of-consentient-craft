import { join, dirname } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const packageScaffoldWriteBrokerProxy = (): {
  setupTargetMissing: (params: {
    packageRoot: string;
    files: readonly { relativePath: PathSegment; contents: string }[];
  }) => void;
  setupTargetExists: (params: { packageRoot: string }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const existsProxy = existsSyncProxy();
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();
  const realPath = requireActual<{ join: typeof join; dirname: typeof dirname }>({
    module: 'path',
  });
  const joinHandle = registerMock({ fn: join });
  const dirnameHandle = registerMock({ fn: dirname });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const writtenPaths: string[] = [];

  return {
    setupTargetMissing: ({ packageRoot, files }): void => {
      existsProxy.returns({ path: packageRoot, exists: false });

      for (const file of files) {
        const absolutePath = realPath.join(packageRoot, file.relativePath);
        const parentDir = realPath.dirname(absolutePath);

        joinHandle.calledWith([packageRoot, file.relativePath]).returns(absolutePath);
        dirnameHandle.calledWith([absolutePath]).returns(parentDir);

        mkdirProxy.succeeds({ path: parentDir });
        writeProxy.succeeds({ path: absolutePath });
        writtenPaths.push(absolutePath);
      }
    },

    setupTargetExists: ({ packageRoot }): void => {
      existsProxy.returns({ path: packageRoot, exists: true });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writtenPaths.flatMap((path) => {
        const content = writeProxy.writtenContentsFor({ path });
        return content === undefined ? [] : [{ path, content }];
      }),
  };
};
