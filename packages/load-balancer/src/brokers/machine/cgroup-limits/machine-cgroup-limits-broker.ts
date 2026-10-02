/**
 * PURPOSE: Reads Linux cgroup v2 memory and CPU limits and current memory usage from
 * `/sys/fs/cgroup/memory.max`, `/sys/fs/cgroup/cpu.max`, and `/sys/fs/cgroup/memory.current`.
 * When files are missing, empty, or specify 'max' (unconstrained), the corresponding limits
 * evaluate to null so callers know no container constraints apply.
 *
 * USAGE:
 * await machineCgroupLimitsBroker();
 * // Returns { memoryLimitMB: 4096, cpuLimitCores: 2, cgroupUsageMB: 1024 }
 */

import { readFileIfExists } from '#gateway/node/fs__promises';

import { machineStatics } from '../../../statics/machine/machine-statics';

const CGROUP_MEMORY_MAX_PATH = '/sys/fs/cgroup/memory.max';
const CGROUP_CPU_MAX_PATH = '/sys/fs/cgroup/cpu.max';
const CGROUP_MEMORY_CURRENT_PATH = '/sys/fs/cgroup/memory.current';

export const machineCgroupLimitsBroker = async (): Promise<{
  memoryLimitMB: number | null;
  cpuLimitCores: number | null;
  cgroupUsageMB: number | null;
}> => {
  const [memoryMaxRaw, cpuMaxRaw, memoryCurrentRaw] = await Promise.all([
    readFileIfExists(CGROUP_MEMORY_MAX_PATH),
    readFileIfExists(CGROUP_CPU_MAX_PATH),
    readFileIfExists(CGROUP_MEMORY_CURRENT_PATH),
  ]);

  const { bytesPerMegabyte } = machineStatics.units;

  let memoryLimitMB: number | null = null;
  if (memoryMaxRaw !== null) {
    const trimmedMemoryMax = memoryMaxRaw.trim();
    if (trimmedMemoryMax.length > 0 && !trimmedMemoryMax.includes('max')) {
      const bytes = Number(trimmedMemoryMax);
      if (Number.isFinite(bytes) && bytes >= 0) {
        memoryLimitMB = Math.floor(bytes / bytesPerMegabyte);
      }
    }
  }

  let cpuLimitCores: number | null = null;
  if (cpuMaxRaw !== null) {
    const trimmedCpuMax = cpuMaxRaw.trim();
    if (trimmedCpuMax.length > 0) {
      const [quotaStr, periodStr] = trimmedCpuMax.split(' ');
      if (quotaStr !== undefined && quotaStr !== 'max' && periodStr !== undefined) {
        const quota = Number(quotaStr);
        const period = Number(periodStr);
        if (Number.isFinite(quota) && Number.isFinite(period) && period > 0 && quota >= 0) {
          cpuLimitCores = Math.ceil(quota / period);
        }
      }
    }
  }

  let cgroupUsageMB: number | null = null;
  if (memoryCurrentRaw !== null) {
    const trimmedMemoryCurrent = memoryCurrentRaw.trim();
    if (trimmedMemoryCurrent.length > 0) {
      const bytes = Number(trimmedMemoryCurrent);
      if (Number.isFinite(bytes) && bytes >= 0) {
        cgroupUsageMB = Math.floor(bytes / bytesPerMegabyte);
      }
    }
  }

  return {
    memoryLimitMB,
    cpuLimitCores,
    cgroupUsageMB,
  };
};
