/**
 * PURPOSE: Proxy for os-info-adapter — mocks the four no-argument `os` calls
 * (`freemem`/`totalmem`/`cpus`/`loadavg`) this adapter converts into machineStatics' byte-to-
 * megabyte units.
 *
 * USAGE:
 * const proxy = osInfoAdapterProxy();
 * proxy.stages({ freeMemBytes: 980 * 1_048_576, totalMemBytes: 16000 * 1_048_576, coreCount: 8, loadAvg: [7.9, 6.2, 4.1] });
 */

import { cpus, freemem, loadavg, totalmem } from 'os';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const osInfoAdapterProxy = (): {
  stages: (params: {
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
  }) => void;
} => {
  const freememHandle: MockHandle = registerMock({ fn: freemem });
  const totalmemHandle: MockHandle = registerMock({ fn: totalmem });
  const cpusHandle: MockHandle = registerMock({ fn: cpus });
  const loadavgHandle: MockHandle = registerMock({ fn: loadavg });

  return {
    stages: ({
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
      // The adapter reads only `.length`, so a placeholder entry per core is enough to prove the
      // count conversion without depending on `os.CpuInfo`'s other fields.
      cpusHandle.calledWith([]).returns(Array.from({ length: coreCount }, () => ({})));
      loadavgHandle.calledWith([]).returns([...loadAvg]);
    },
  };
};
