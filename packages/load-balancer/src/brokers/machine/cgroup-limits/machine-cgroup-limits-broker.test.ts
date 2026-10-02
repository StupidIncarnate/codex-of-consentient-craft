import { machineCgroupLimitsBroker } from './machine-cgroup-limits-broker';
import { machineCgroupLimitsBrokerProxy } from './machine-cgroup-limits-broker.proxy';

describe('machineCgroupLimitsBroker', () => {
  it('EMPTY: {no cgroup files exist} => returns all limits and usage as null', async () => {
    const proxy = machineCgroupLimitsBrokerProxy();
    proxy.setupAllMissing();

    const result = await machineCgroupLimitsBroker();

    expect(result).toStrictEqual({
      memoryLimitMB: null,
      cpuLimitCores: null,
      cgroupUsageMB: null,
    });
  });

  it("EMPTY: {memory and cpu files contain 'max'} => returns all limits as null", async () => {
    const proxy = machineCgroupLimitsBrokerProxy();
    proxy.setupLimits({
      memoryMax: 'max\n',
      cpuMax: 'max 100000\n',
      memoryCurrent: null,
    });

    const result = await machineCgroupLimitsBroker();

    expect(result).toStrictEqual({
      memoryLimitMB: null,
      cpuLimitCores: null,
      cgroupUsageMB: null,
    });
  });

  it('VALID: {4 GB memory limit} => returns 4096 MB', async () => {
    const proxy = machineCgroupLimitsBrokerProxy();
    proxy.setupLimits({
      memoryMax: '4294967296\n',
      cpuMax: null,
      memoryCurrent: null,
    });

    const result = await machineCgroupLimitsBroker();

    expect(result).toStrictEqual({
      memoryLimitMB: 4096,
      cpuLimitCores: null,
      cgroupUsageMB: null,
    });
  });

  it("VALID: {cpu max quota '200000 100000'} => returns 2 cores", async () => {
    const proxy = machineCgroupLimitsBrokerProxy();
    proxy.setupLimits({
      memoryMax: null,
      cpuMax: '200000 100000\n',
      memoryCurrent: null,
    });

    const result = await machineCgroupLimitsBroker();

    expect(result).toStrictEqual({
      memoryLimitMB: null,
      cpuLimitCores: 2,
      cgroupUsageMB: null,
    });
  });

  it("VALID: {cpu max quota '150000 100000'} => returns 2 cores rounded up via ceil", async () => {
    const proxy = machineCgroupLimitsBrokerProxy();
    proxy.setupLimits({
      memoryMax: null,
      cpuMax: '150000 100000\n',
      memoryCurrent: null,
    });

    const result = await machineCgroupLimitsBroker();

    expect(result).toStrictEqual({
      memoryLimitMB: null,
      cpuLimitCores: 2,
      cgroupUsageMB: null,
    });
  });

  it('VALID: {cgroup current memory present} => converts bytes to MB', async () => {
    const proxy = machineCgroupLimitsBrokerProxy();
    proxy.setupLimits({
      memoryMax: null,
      cpuMax: null,
      memoryCurrent: '1073741824\n',
    });

    const result = await machineCgroupLimitsBroker();

    expect(result).toStrictEqual({
      memoryLimitMB: null,
      cpuLimitCores: null,
      cgroupUsageMB: 1024,
    });
  });

  it('EMPTY: {empty cgroup files} => returns limits as null', async () => {
    const proxy = machineCgroupLimitsBrokerProxy();
    proxy.setupLimits({
      memoryMax: '   \n',
      cpuMax: '   \n',
      memoryCurrent: '   \n',
    });

    const result = await machineCgroupLimitsBroker();

    expect(result).toStrictEqual({
      memoryLimitMB: null,
      cpuLimitCores: null,
      cgroupUsageMB: null,
    });
  });
});
