import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const e2eArtifactsRemoveBrokerProxy = (): {
  setupRemovable: (params: { packageRoot: AbsoluteFilePath; port: number }) => void;
  setupRemoveFails: (params: { packageRoot: AbsoluteFilePath; port: number }) => void;
  getRemovedPaths: (params: {
    packageRoot: AbsoluteFilePath;
    port: number;
  }) => readonly unknown[][];
} => {
  const rm = rmProxy();

  const cachePathFor = ({
    packageRoot,
    port,
  }: {
    packageRoot: AbsoluteFilePath;
    port: number;
  }): ReturnType<typeof filePathContract.parse> =>
    `${String(packageRoot)}/node_modules/.vite-${String(port)}`;

  return {
    setupRemovable: ({ packageRoot, port }): void => {
      rm.succeeds({ path: String(cachePathFor({ packageRoot, port })) });
    },
    setupRemoveFails: ({ packageRoot, port }): void => {
      const path = String(cachePathFor({ packageRoot, port }));
      rm.rejects({
        path,
        error: FsErrorStub({
          code: 'EACCES',
          syscall: 'rm',
          path,
        }),
      });
    },
    getRemovedPaths: ({ packageRoot, port }): readonly unknown[][] =>
      rm.getCallsFor({ path: String(cachePathFor({ packageRoot, port })) }),
  };
};
