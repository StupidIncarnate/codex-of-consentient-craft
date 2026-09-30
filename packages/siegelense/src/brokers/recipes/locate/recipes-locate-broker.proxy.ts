import { join } from '#gateway/node/path';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';

// The same sticky default `processCwdAdapterProxy` used to install unconditionally — several
// OTHER siegelense proxies (`run-execute-broker.proxy.ts` among them) still stage a packagePath
// computed off THIS exact literal, without ever calling a setup method here.
const DEFAULT_CWD_VALUE = '/default/cwd';

export const recipesLocateBrokerProxy = (): {
  setupPresentAndBuilt: (params: {
    cwdPath: string;
    packagePath: string;
    entryPath: string;
  }) => void;
  setupPresentAndBuiltAt: (params: { packagePath: string; entryPath: string }) => void;
  setupPackageMissing: (params: { cwdPath: string; packagePath: string }) => void;
  setupBuildMissing: (params: {
    cwdPath: string;
    packagePath: string;
    entryPath: string;
  }) => void;
} => {
  // cwd() takes no arguments, so the one staged value answers every read until the next setupCwd
  // replaces it: a default here, replaced by each scenario method below.
  const cwdStagingProxy = cwdProxy();
  cwdStagingProxy.setupCwd({ value: DEFAULT_CWD_VALUE });

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
      packagePath: string;
      entryPath: string;
    }): void => {
      cwdStagingProxy.setupCwd({ value: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: true });
    },

    setupPresentAndBuiltAt: ({
      packagePath,
      entryPath,
    }: {
      packagePath: string;
      entryPath: string;
    }): void => {
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: true });
    },

    setupPackageMissing: ({
      cwdPath,
      packagePath,
    }: {
      cwdPath: string;
      packagePath: string;
    }): void => {
      cwdStagingProxy.setupCwd({ value: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      existsProxy.returns({ path: packagePath, exists: false });
    },

    setupBuildMissing: ({
      cwdPath,
      packagePath,
      entryPath,
    }: {
      cwdPath: string;
      packagePath: string;
      entryPath: string;
    }): void => {
      cwdStagingProxy.setupCwd({ value: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      existsProxy.returns({ path: packagePath, exists: true });
      existsProxy.returns({ path: entryPath, exists: false });
    },
  };
};
