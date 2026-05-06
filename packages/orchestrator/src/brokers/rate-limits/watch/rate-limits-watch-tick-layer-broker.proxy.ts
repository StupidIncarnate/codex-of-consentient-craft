import { locationsRateLimitsSnapshotPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const rateLimitsWatchTickLayerBrokerProxy = (): {
  setupReadSucceeds: ({ contents }: { contents: string }) => void;
  setupReadEnoent: () => void;
  setupReadError: ({ error }: { error: Error }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();
  const pathProxy = locationsRateLimitsSnapshotPathFindBrokerProxy();

  pathProxy.setupSnapshotPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    snapshotPath: FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json' }),
  });

  return {
    setupReadSucceeds: ({ contents }: { contents: string }): void => {
      readProxy.resolves({ content: contents });
    },
    setupReadEnoent: (): void => {
      const error = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
      readProxy.rejects({ error });
    },
    setupReadError: ({ error }: { error: Error }): void => {
      readProxy.rejects({ error });
    },
  };
};
