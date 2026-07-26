import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { moduleRequireFreshAdapterProxy } from '../../../adapters/module/require-fresh/module-require-fresh-adapter.proxy';
import { hookConfigDefaultBrokerProxy } from '../default/hook-config-default-broker.proxy';
import { hookConfigMergeBrokerProxy } from '../merge/hook-config-merge-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const hookConfigLoadBrokerProxy = (): {
  setupConfigPath: (params: { workingDir: string; filename: string; path: FilePath }) => void;
  setupConfigExists: (params: { filePath: FilePath; exists: boolean }) => void;
} => {
  processCwdAdapterProxy();
  const pathProxy = pathResolveAdapterProxy();
  const fsProxy = fsExistsSyncAdapterProxy();
  moduleRequireFreshAdapterProxy();
  hookConfigDefaultBrokerProxy();
  hookConfigMergeBrokerProxy();

  // hookConfigLoadBroker resolves every candidate config filename before checking existence.
  // pathResolveAdapterProxy no longer has a global default, so a candidate a test hasn't
  // addressed via setupConfigPath would otherwise throw — give every other call a real-ish
  // placeholder instead (its value only matters for a candidate a test explicitly wires up).
  pathProxy
    .getHandle()
    .calledWith([])
    .returns(FilePathStub({ value: '/unused/config/path' }));

  return {
    setupConfigPath: ({
      workingDir,
      filename,
      path,
    }: {
      workingDir: string;
      filename: string;
      path: FilePath;
    }): void => {
      pathProxy.returns({ paths: [workingDir, filename], path });
    },
    setupConfigExists: ({ filePath, exists }: { filePath: FilePath; exists: boolean }): void => {
      fsProxy.returns({ filePath, exists });
    },
  };
};
