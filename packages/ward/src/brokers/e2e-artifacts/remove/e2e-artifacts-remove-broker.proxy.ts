import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

export const e2eArtifactsRemoveBrokerProxy = (): {
  setupRemovable: (params: { packageRoot: string; port: number }) => void;
  setupRemoveFails: (params: { packageRoot: string; port: number }) => void;
  getRemovedPaths: (params: {
    packageRoot: string;
    port: number;
  }) => readonly unknown[][];
} => {
  const rm = rmProxy();

  const cachePathFor = ({
    packageRoot,
    port,
  }: {
    packageRoot: string;
    port: number;
  }): string =>
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
