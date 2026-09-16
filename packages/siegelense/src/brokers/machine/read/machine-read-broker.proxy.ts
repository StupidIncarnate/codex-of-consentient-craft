import { AbsoluteFilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';

import { fsStatfsAdapterProxy } from '../../../adapters/fs/statfs/fs-statfs-adapter.proxy';
import { osInfoAdapterProxy } from '../../../adapters/os/info/os-info-adapter.proxy';
import { machineOomCountBrokerProxy } from '../oom-count/machine-oom-count-broker.proxy';

export const machineReadBrokerProxy = (): {
  setupMachineReading: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
    vmstatContent: string;
  }) => void;
  setupOomUnavailable: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
  }) => void;
  setupSiegelenseDirNotYetCreated: (params: {
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
    vmstatContent: string;
  }) => void;
  setupHomeStatfsPermissionDenied: (params: {
    homeDir: string;
    homePath: FilePath;
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    vmstatContent: string;
  }) => void;
} => {
  const osProxy = osInfoAdapterProxy();
  const homeProxy = dungeonmasterHomeFindBrokerProxy();
  const statfsProxy = fsStatfsAdapterProxy();
  const oomProxy = machineOomCountBrokerProxy();

  return {
    // `rootPath` stays in the accepted shape and is bound (as `_rootPath`) purely so
    // enforce-proxy-param-binding sees it destructured — statusReadBrokerProxy still passes it, and
    // machineReadBroker statfs's the dungeonmaster HOME path now, never `<home>/siegelense`. See
    // machine-read-broker.ts's header for why.
    setupMachineReading: ({
      homeDir,
      homePath,
      rootPath: _rootPath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      diskBavail,
      diskBsize,
      vmstatContent,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      diskBavail: number;
      diskBsize: number;
      vmstatContent: string;
    }): void => {
      osProxy.stages({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.resolves({
        dirPath: AbsoluteFilePathStub({ value: homePath }),
        bavail: diskBavail,
        bsize: diskBsize,
      });
      oomProxy.setupVmstat({ content: vmstatContent });
    },

    setupOomUnavailable: ({
      homeDir,
      homePath,
      rootPath: _rootPath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      diskBavail,
      diskBsize,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      diskBavail: number;
      diskBsize: number;
    }): void => {
      osProxy.stages({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.resolves({
        dirPath: AbsoluteFilePathStub({ value: homePath }),
        bavail: diskBavail,
        bsize: diskBsize,
      });
      oomProxy.setupVmstatMissing();
    },

    // Proves the fix: `rootPath` (the `<home>/siegelense` directory) is staged to REJECT with
    // ENOENT — the real symptom on a fresh machine, where no instance has ever created it — while
    // `homePath` resolves normally. machineReadBroker never asks statfs about `rootPath` at all, so
    // this rejection is never consumed; a broker that regressed to statfs-ing the siegelense root
    // would hit it and reject instead of answering.
    setupSiegelenseDirNotYetCreated: ({
      homeDir,
      homePath,
      rootPath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      diskBavail,
      diskBsize,
      vmstatContent,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      diskBavail: number;
      diskBsize: number;
      vmstatContent: string;
    }): void => {
      osProxy.stages({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.resolves({
        dirPath: AbsoluteFilePathStub({ value: homePath }),
        bavail: diskBavail,
        bsize: diskBsize,
      });
      statfsProxy.rejects({
        dirPath: AbsoluteFilePathStub({ value: rootPath }),
        error: Object.assign(new Error(`ENOENT: no such file or directory, statfs '${rootPath}'`), {
          code: 'ENOENT',
        }),
      });
      oomProxy.setupVmstat({ content: vmstatContent });
    },

    // Proves the narrow classification holds: a genuine permission error reading the (now always
    // statfs'd) home path still propagates rather than being swallowed into a `null` freeDiskMB.
    setupHomeStatfsPermissionDenied: ({
      homeDir,
      homePath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      vmstatContent,
    }: {
      homeDir: string;
      homePath: FilePath;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      vmstatContent: string;
    }): void => {
      osProxy.stages({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.rejects({
        dirPath: AbsoluteFilePathStub({ value: homePath }),
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });
      oomProxy.setupVmstat({ content: vmstatContent });
    },
  };
};
