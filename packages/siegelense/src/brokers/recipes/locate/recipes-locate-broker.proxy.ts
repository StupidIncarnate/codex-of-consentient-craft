import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const recipesLocateBrokerProxy = (): {
  setupPresentAndBuilt: (params: { packagePath: string; entryPath: string }) => void;
  setupPackageMissing: (params: { packagePath: string }) => void;
  setupBuildMissing: (params: { packagePath: string; entryPath: string }) => void;
} => {
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — every
  // packagePath/entryPath a scenario below names is exactly what a real join over the caller's
  // repoRoot and recipesConventionStatics' fixed segments already produces.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  const existsProxy = existsSyncProxy();

  return {
    setupPresentAndBuilt: ({
      packagePath,
      entryPath,
    }: {
      packagePath: string;
      entryPath: string;
    }): void => {
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: true });
    },

    setupPackageMissing: ({ packagePath }: { packagePath: string }): void => {
      existsProxy.returns({ path: packagePath, exists: false });
    },

    setupBuildMissing: ({
      packagePath,
      entryPath,
    }: {
      packagePath: string;
      entryPath: string;
    }): void => {
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: false });
    },
  };
};
