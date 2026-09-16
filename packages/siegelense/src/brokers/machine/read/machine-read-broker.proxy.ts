import { AbsoluteFilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';

import { fsStatfsAdapterProxy } from '../../../adapters/fs/statfs/fs-statfs-adapter.proxy';
import { osInfoAdapterProxy } from '../../../adapters/os/info/os-info-adapter.proxy';
import { locationsRootPathFindBrokerProxy } from '../../locations/root-path-find/locations-root-path-find-broker.proxy';
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
} => {
  const osProxy = osInfoAdapterProxy();
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const statfsProxy = fsStatfsAdapterProxy();
  const oomProxy = machineOomCountBrokerProxy();

  return {
    setupMachineReading: ({
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
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      statfsProxy.resolves({
        dirPath: AbsoluteFilePathStub({ value: rootPath }),
        bavail: diskBavail,
        bsize: diskBsize,
      });
      oomProxy.setupVmstat({ content: vmstatContent });
    },

    setupOomUnavailable: ({
      homeDir,
      homePath,
      rootPath,
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
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      statfsProxy.resolves({
        dirPath: AbsoluteFilePathStub({ value: rootPath }),
        bavail: diskBavail,
        bsize: diskBsize,
      });
      oomProxy.setupVmstatMissing();
    },
  };
};
