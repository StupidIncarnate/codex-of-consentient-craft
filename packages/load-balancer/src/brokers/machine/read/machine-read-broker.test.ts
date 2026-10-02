import { machineReadBroker } from './machine-read-broker';
import { machineReadBrokerProxy } from './machine-read-broker.proxy';

const DISK_PATH = '/path/to/disk';

describe('machineReadBroker', () => {
  it('VALID: {os, disk and oom readings all available} => returns the complete machine reading', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupMachineReading({
      diskPath: DISK_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      diskBavail: 512_000,
      diskBsize: 4096,
      vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
    });

    const result = await machineReadBroker({ diskPath: DISK_PATH });

    expect(result).toStrictEqual({
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2000,
      cores: 8,
      loadAvg: [7.9, 6.2, 4.1],
      oomKillsSinceBoot: 2,
    });
  });

  it('VALID: {cgroup memory limit of 4 GB on 64 GB host} => caps totalMemMB at 4096 and adjusts freeMemMB', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupMachineReading({
      diskPath: DISK_PATH,
      freeMemBytes: 32_000 * 1_048_576,
      totalMemBytes: 64_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [1.0, 1.0, 1.0],
      diskBavail: 512_000,
      diskBsize: 4096,
      vmstatContent: 'nr_free_pages 100\noom_kill 0\n',
      cgroupLimits: {
        memoryMax: '4294967296\n',
        cpuMax: null,
        memoryCurrent: '1073741824\n',
      },
    });

    const result = await machineReadBroker({ diskPath: DISK_PATH });

    expect(result).toStrictEqual({
      freeMemMB: 3072,
      totalMemMB: 4096,
      freeDiskMB: 2000,
      cores: 8,
      loadAvg: [1.0, 1.0, 1.0],
      oomKillsSinceBoot: 0,
    });
  });

  it('VALID: {cgroup cpu limit of 2 cores on 8 core host} => caps cores at 2', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupMachineReading({
      diskPath: DISK_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [1.0, 1.0, 1.0],
      diskBavail: 512_000,
      diskBsize: 4096,
      vmstatContent: 'nr_free_pages 100\noom_kill 0\n',
      cgroupLimits: {
        memoryMax: null,
        cpuMax: '200000 100000\n',
        memoryCurrent: null,
      },
    });

    const result = await machineReadBroker({ diskPath: DISK_PATH });

    expect(result).toStrictEqual({
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2000,
      cores: 2,
      loadAvg: [1.0, 1.0, 1.0],
      oomKillsSinceBoot: 0,
    });
  });

  it("VALID: {cgroup limits set to 'max'} => preserves host memory and cores figures", async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupMachineReading({
      diskPath: DISK_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      diskBavail: 512_000,
      diskBsize: 4096,
      vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
      cgroupLimits: {
        memoryMax: 'max\n',
        cpuMax: 'max 100000\n',
        memoryCurrent: null,
      },
    });

    const result = await machineReadBroker({ diskPath: DISK_PATH });

    expect(result).toStrictEqual({
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2000,
      cores: 8,
      loadAvg: [7.9, 6.2, 4.1],
      oomKillsSinceBoot: 2,
    });
  });

  it('EMPTY: {oom count unavailable} => returns oomKillsSinceBoot null without losing the rest', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupOomUnavailable({
      diskPath: DISK_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      diskBavail: 512_000,
      diskBsize: 4096,
    });

    const result = await machineReadBroker({ diskPath: DISK_PATH });

    expect(result).toStrictEqual({
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2000,
      cores: 8,
      loadAvg: [7.9, 6.2, 4.1],
      oomKillsSinceBoot: null,
    });
  });

  it('ERROR: {disk path statfs rejects with ENOENT} => propagates the missing error rather than reporting a clean machine', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupDiskMissing({
      diskPath: DISK_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
    });

    await expect(machineReadBroker({ diskPath: DISK_PATH })).rejects.toThrow(/ENOENT/u);
  });

  it('ERROR: {disk path statfs rejects with EACCES} => propagates the permission error rather than reporting a clean machine', async () => {
    const proxy = machineReadBrokerProxy();
    proxy.setupDiskStatfsPermissionDenied({
      diskPath: DISK_PATH,
      freeMemBytes: 980 * 1_048_576,
      totalMemBytes: 16_000 * 1_048_576,
      coreCount: 8,
      loadAvg: [7.9, 6.2, 4.1],
      vmstatContent: 'nr_free_pages 100\noom_kill 2\n',
    });

    await expect(machineReadBroker({ diskPath: DISK_PATH })).rejects.toThrow(/EACCES/u);
  });
});
