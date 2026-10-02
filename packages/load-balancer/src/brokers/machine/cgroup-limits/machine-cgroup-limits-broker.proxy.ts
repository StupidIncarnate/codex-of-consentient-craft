import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

const CGROUP_MEMORY_MAX_PATH = '/sys/fs/cgroup/memory.max';
const CGROUP_CPU_MAX_PATH = '/sys/fs/cgroup/cpu.max';
const CGROUP_MEMORY_CURRENT_PATH = '/sys/fs/cgroup/memory.current';

export const machineCgroupLimitsBrokerProxy = (): {
  setupLimits: (params?: {
    memoryMax?: string | null;
    cpuMax?: string | null;
    memoryCurrent?: string | null;
  }) => void;
  setupAllMissing: () => void;
} => {
  const readFileMock = readFileIfExistsProxy();

  const setupMemoryMax = (value: string | null): void => {
    if (value === null) {
      readFileMock.missing({ path: CGROUP_MEMORY_MAX_PATH });
    } else {
      readFileMock.returns({ path: CGROUP_MEMORY_MAX_PATH, contents: value });
    }
  };

  const setupCpuMax = (value: string | null): void => {
    if (value === null) {
      readFileMock.missing({ path: CGROUP_CPU_MAX_PATH });
    } else {
      readFileMock.returns({ path: CGROUP_CPU_MAX_PATH, contents: value });
    }
  };

  const setupMemoryCurrent = (value: string | null): void => {
    if (value === null) {
      readFileMock.missing({ path: CGROUP_MEMORY_CURRENT_PATH });
    } else {
      readFileMock.returns({ path: CGROUP_MEMORY_CURRENT_PATH, contents: value });
    }
  };

  return {
    setupLimits: ({
      memoryMax = null,
      cpuMax = null,
      memoryCurrent = null,
    }: {
      memoryMax?: string | null;
      cpuMax?: string | null;
      memoryCurrent?: string | null;
    } = {}): void => {
      setupMemoryMax(memoryMax);
      setupCpuMax(cpuMax);
      setupMemoryCurrent(memoryCurrent);
    },

    setupAllMissing: (): void => {
      setupMemoryMax(null);
      setupCpuMax(null);
      setupMemoryCurrent(null);
    },
  };
};
