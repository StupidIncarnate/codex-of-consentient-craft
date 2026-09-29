import type { dirname, join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { requireActual } from '@dungeonmaster/testing/register-mock';

export const packageRootFindLayerBrokerProxy = (): {
  setupPackageJsonAt: (params: { dirPath: string; exists: boolean }) => void;
  // Stages "no package.json" at `startDir` and at every ancestor up to the filesystem root.
  setupNoPackageJsonFrom: (params: { startDir: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  // The REAL `path` functions: a composing proxy may already have mocked `dirname`/`join`.
  const realPath = requireActual<{ dirname: typeof dirname; join: typeof join }>({
    module: 'path',
  });

  const setupPackageJsonAt = ({ dirPath, exists }: { dirPath: string; exists: boolean }): void => {
    existsProxy.returns({ path: realPath.join(dirPath, 'package.json'), exists });
  };

  const setupNoPackageJsonFrom = ({ startDir }: { startDir: string }): void => {
    setupPackageJsonAt({ dirPath: startDir, exists: false });
    const parentDir = realPath.dirname(startDir);
    if (parentDir !== startDir) {
      setupNoPackageJsonFrom({ startDir: parentDir });
    }
  };

  return { setupPackageJsonAt, setupNoPackageJsonFrom };
};
