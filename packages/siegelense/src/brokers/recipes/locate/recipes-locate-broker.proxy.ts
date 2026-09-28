import { join } from '#gateway/node/path';
import { cwd } from '#gateway/node/process';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

// The same sticky default `processCwdAdapterProxy` used to install unconditionally — several
// OTHER siegelense proxies (`run-execute-broker.proxy.ts` among them) still stage a packagePath
// computed off THIS exact literal, without ever calling a setup method here.
const DEFAULT_CWD_VALUE = '/default/cwd';

export const recipesLocateBrokerProxy = (): {
  setupPresentAndBuilt: (params: {
    cwdPath: string;
    packagePath: FilePath;
    entryPath: FilePath;
  }) => void;
  setupPresentAndBuiltAt: (params: { packagePath: FilePath; entryPath: FilePath }) => void;
  setupPackageMissing: (params: { cwdPath: string; packagePath: FilePath }) => void;
  setupBuildMissing: (params: {
    cwdPath: string;
    packagePath: FilePath;
    entryPath: FilePath;
  }) => void;
} => {
  cwdProxy(); // inert, satisfies enforce-proxy-child-creation
  const cwdHandle = registerMock({ fn: cwd });
  // cwd() takes no arguments — there is no call-site value to key on, so [] is the honest
  // address, not a shortcut. Sticky default; each setup method's own one-shot below outranks it.
  cwdHandle.calledWith([]).returns(DEFAULT_CWD_VALUE);

  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — every
  // packagePath/entryPath a scenario below names is exactly what a real join over cwdPath (or the
  // sticky DEFAULT_CWD_VALUE) and recipesConventionStatics' fixed segments already produces.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  const resolveProxy = cwdResolveBrokerProxy();
  const existsProxy = existsSyncProxy();

  return {
    setupPresentAndBuilt: ({
      cwdPath,
      packagePath,
      entryPath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
      entryPath: FilePath;
    }): void => {
      cwdHandle.onceFor([]).returns(cwdPath);
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: true });
    },

    setupPresentAndBuiltAt: ({
      packagePath,
      entryPath,
    }: {
      packagePath: FilePath;
      entryPath: FilePath;
    }): void => {
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: true });
    },

    setupPackageMissing: ({
      cwdPath,
      packagePath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
    }): void => {
      cwdHandle.onceFor([]).returns(cwdPath);
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      existsProxy.returns({ path: packagePath, exists: false });
    },

    setupBuildMissing: ({
      cwdPath,
      packagePath,
      entryPath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
      entryPath: FilePath;
    }): void => {
      cwdHandle.onceFor([]).returns(cwdPath);
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: false });
    },
  };
};
