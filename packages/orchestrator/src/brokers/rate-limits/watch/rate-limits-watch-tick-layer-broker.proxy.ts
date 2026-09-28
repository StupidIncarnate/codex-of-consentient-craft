import { locationsRateLimitsSnapshotPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FsError } from '#gateway/node/fs';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const rateLimitsWatchTickLayerBrokerProxy = (): {
  setupReadSucceeds: ({ contents }: { contents: string }) => void;
  setupReadEnoent: () => void;
  setupReadError: ({ error }: { error: FsError }) => void;
} => {
  const readProxy = readFileIfExistsProxy();
  const pathProxy = locationsRateLimitsSnapshotPathFindBrokerProxy();

  const snapshotPath = FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json' });
  pathProxy.setupSnapshotPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    snapshotPath,
  });

  return {
    setupReadSucceeds: ({ contents }: { contents: string }): void => {
      readProxy.returns({ path: snapshotPath, contents });
    },
    setupReadEnoent: (): void => {
      readProxy.missing({ path: snapshotPath });
    },
    setupReadError: ({ error }: { error: FsError }): void => {
      readProxy.throwsMatchingPath({ path: snapshotPath, error });
    },
  };
};
