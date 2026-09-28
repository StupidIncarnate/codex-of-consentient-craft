import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { join, resolve } from '#gateway/node/path';

import { fsReadlinkAdapterProxy } from '../../../adapters/fs/readlink/fs-readlink-adapter.proxy';

export const walkSymlinksLayerBrokerProxy = (): {
  setupDirectoryEntries: (params: {
    dirPath: AbsoluteFilePath;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupReadlinkTarget: (params: { linkPath: FilePath; target: string }) => void;
  setupReadlinkThrows: (params: { linkPath: FilePath; error: Error }) => void;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const readlinkProxy = fsReadlinkAdapterProxy();
  // Both wired to satisfy enforce-proxy-child-creation and both left UNADDRESSED on purpose: each
  // defaults to a real passthrough, so every path a test stages must match Node's own
  // path.join / path.resolve output byte-for-byte.
  const realPath = requireActual<{ join: typeof join; resolve: typeof resolve }>({
    module: 'path',
  });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  registerMock({ fn: resolve })
    .calledWith([])
    .implement((...segments: never[]) => realPath.resolve(...segments));

  return {
    setupDirectoryEntries: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: { name: string; isDir: boolean; isSymlink: boolean }[];
    }): void => {
      readdirProxy.returns({
        path: dirPath,
        entries: entries.map(({ name, isDir, isSymlink }) => ({
          name,
          kind: isSymlink
            ? ('symlink' as const)
            : isDir
              ? ('directory' as const)
              : ('file' as const),
        })),
      });
    },

    setupReadlinkTarget: ({ linkPath, target }: { linkPath: FilePath; target: string }): void => {
      readlinkProxy.returns({ linkPath, target });
    },

    setupReadlinkThrows: ({ linkPath, error }: { linkPath: FilePath; error: Error }): void => {
      readlinkProxy.throws({ linkPath, error });
    },
  };
};
