import { diskFreeBytesProxy } from '#gateway/node/fs__promises/disk-free-bytes/disk-free-bytes.proxy';
import { cpus, freemem, loadavg, totalmem } from '#gateway/node/os';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import { machineOomCountBrokerProxy } from '../oom-count/machine-oom-count-broker.proxy';

export const machineReadBrokerProxy = (): {
  setupMachineReading: (params: {
    diskPath: string;
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
    vmstatContent: string;
  }) => void;
  setupOomUnavailable: (params: {
    diskPath: string;
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
  }) => void;
  setupDiskMissing: (params: {
    diskPath: string;
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    vmstatContent: string;
  }) => void;
  setupDiskStatfsPermissionDenied: (params: {
    diskPath: string;
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

  const statfsProxy = diskFreeBytesProxy();
  const oomProxy = machineOomCountBrokerProxy();

  return {
    setupMachineReading: ({
      diskPath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      diskBavail,
      diskBsize,
      vmstatContent,
    }: {
      diskPath: string;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      diskBavail: number;
      diskBsize: number;
      vmstatContent: string;
    }): void => {
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      statfsProxy.returns({
        path: diskPath,
        bavail: diskBavail,
        bsize: diskBsize,
      });
      oomProxy.setupVmstat({ content: vmstatContent });
    },

    setupOomUnavailable: ({
      diskPath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      diskBavail,
      diskBsize,
    }: {
      diskPath: string;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      diskBavail: number;
      diskBsize: number;
    }): void => {
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      statfsProxy.returns({
        path: diskPath,
        bavail: diskBavail,
        bsize: diskBsize,
      });
      oomProxy.setupVmstatMissing();
    },

    setupDiskMissing: ({
      diskPath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      vmstatContent,
    }: {
      diskPath: string;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      vmstatContent: string;
    }): void => {
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      statfsProxy.missing({ path: diskPath });
      oomProxy.setupVmstat({ content: vmstatContent });
    },

    setupDiskStatfsPermissionDenied: ({
      diskPath,
      freeMemBytes,
      totalMemBytes,
      coreCount,
      loadAvg,
      vmstatContent,
    }: {
      diskPath: string;
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      vmstatContent: string;
    }): void => {
      stageOs({ freeMemBytes, totalMemBytes, coreCount, loadAvg });
      statfsProxy.denied({ path: diskPath });
      oomProxy.setupVmstat({ content: vmstatContent });
    },
  };
};
