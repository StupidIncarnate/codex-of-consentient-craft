import { diskFreeBytesProxy } from '#gateway/node/fs__promises/disk-free-bytes/disk-free-bytes.proxy';
import { cpus, freemem, loadavg, totalmem } from '#gateway/node/os';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

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
  const freememHandle: MockHandle = registerMock({ fn: freemem });
  const totalmemHandle: MockHandle = registerMock({ fn: totalmem });
  const cpusHandle: MockHandle = registerMock({ fn: cpus });
  const loadavgHandle: MockHandle = registerMock({ fn: loadavg });

  const stageOs = ({
    freeMemBytes,
    totalMemBytes,
    coreCount,
    loadAvg,
  }: {
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
  }): void => {
    freememHandle.calledWith([]).returns(freeMemBytes);
    totalmemHandle.calledWith([]).returns(totalMemBytes);
    cpusHandle.calledWith([]).returns(Array.from({ length: coreCount }, () => ({})));
    loadavgHandle.calledWith([]).returns([...loadAvg]);
  };

  const homeProxy = dungeonmasterHomeFindBrokerProxy();
  const statfsProxy = diskFreeBytesProxy();
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
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.returns({
        path: homePath,
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
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.returns({
        path: homePath,
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
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.returns({
        path: homePath,
        bavail: diskBavail,
        bsize: diskBsize,
      });
      statfsProxy.missing({ path: rootPath });
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
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      homeProxy.setupHomePath({ homeDir, homePath });
      statfsProxy.denied({ path: homePath });
      oomProxy.setupVmstat({ content: vmstatContent });
    },
  };
};
