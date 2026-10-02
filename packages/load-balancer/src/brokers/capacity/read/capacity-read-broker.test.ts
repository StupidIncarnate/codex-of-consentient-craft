import { NodeVersionUnsupportedError } from '#gateway/node/sqlite';

import { LeaseStub } from '../../../contracts/lease/lease.stub';
import { MachineReadingStub } from '../../../contracts/machine-reading/machine-reading.stub';
import { capacityReadBroker } from './capacity-read-broker';
import { capacityReadBrokerProxy } from './capacity-read-broker.proxy';

describe('capacityReadBroker', () => {
  it('VALID: {diskPath} => returns capacity suggestion with no warnings', async () => {
    const proxy = capacityReadBrokerProxy();
    const diskPath = '/test/disk';
    const machine = MachineReadingStub();
    proxy.setupDefaults({ diskPath, machine });

    const result = await capacityReadBroker({ diskPath });

    expect(result).toStrictEqual({
      suggestion: {
        suggestion: 1,
        cpuLimit: 1,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      },
      machine,
      liveLeases: [],
      resources: {
        maxMemoryPercent: 80,
        maxDiskMB: 4096,
      },
      warnings: [],
    });
  });

  it('VALID: {diskPath, job: {peakMB}} => passes job with peakMB to transformer', async () => {
    const proxy = capacityReadBrokerProxy();
    const diskPath = '/test/disk';
    const machine = MachineReadingStub({
      cores: 8,
      loadAvg: [1.0, 1.0, 1.0],
      freeMemMB: 4000,
      totalMemMB: 8000,
      freeDiskMB: 2000,
      oomKillsSinceBoot: 0,
    });
    proxy.setupDefaults({ diskPath, machine });

    const result = await capacityReadBroker({
      diskPath,
      job: { peakMB: 200 },
    });

    expect(result).toStrictEqual({
      suggestion: {
        suggestion: 7,
        cpuLimit: 7,
        freeMemoryLimit: 17,
        capMemoryLimit: 32,
      },
      machine,
      liveLeases: [],
      resources: {
        maxMemoryPercent: 80,
        maxDiskMB: 4096,
      },
      warnings: [],
    });
  });

  it('VALID: {liveLeases present} => passes live leases to transformer and includes in result', async () => {
    const proxy = capacityReadBrokerProxy();
    const diskPath = '/test/disk';
    const machine = MachineReadingStub({
      cores: 8,
      loadAvg: [1.0, 1.0, 1.0],
      freeMemMB: 4000,
      totalMemMB: 8000,
      freeDiskMB: 2000,
      oomKillsSinceBoot: 0,
    });
    const lease = LeaseStub({
      leaseId: 'lease-test-1',
      tool: 'ward',
      label: '@dungeonmaster/load-balancer',
      ownerPid: 9999,
      state: 'starting',
      expectedPeakMB: 1000,
      currentRssMB: null,
      startedAtMs: 1_700_000_000_000,
      lastBeatMs: 1_700_000_000_000,
    });
    proxy.setupDefaults({ diskPath, machine, leases: [lease] });

    const result = await capacityReadBroker({
      diskPath,
      job: { peakMB: 200 },
    });

    expect(result).toStrictEqual({
      suggestion: {
        suggestion: 7,
        cpuLimit: 7,
        freeMemoryLimit: 12,
        capMemoryLimit: 27,
      },
      machine,
      liveLeases: [lease],
      resources: {
        maxMemoryPercent: 80,
        maxDiskMB: 4096,
      },
      warnings: [],
    });
  });

  it('VALID: {limitsWarning present} => includes limits warning in returned warnings list', async () => {
    const proxy = capacityReadBrokerProxy();
    const diskPath = '/test/disk';
    const machine = MachineReadingStub();
    const limitsWarning = 'config.json has invalid maxMemoryPercent: 120. Using defaults.';
    proxy.setupDefaults({ diskPath, machine, warning: limitsWarning });

    const result = await capacityReadBroker({ diskPath });

    expect(result).toStrictEqual({
      suggestion: {
        suggestion: 1,
        cpuLimit: 1,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      },
      machine,
      liveLeases: [],
      resources: {
        maxMemoryPercent: 80,
        maxDiskMB: 4096,
      },
      warnings: [limitsWarning],
    });
  });

  it('ERROR: {leaseListLive throws Error} => returns empty leases, captures warning, and calculates suggestion', async () => {
    const proxy = capacityReadBrokerProxy();
    const diskPath = '/test/disk';
    const machine = MachineReadingStub();
    proxy.setupDefaults({ diskPath, machine });
    proxy.setupLeasesFailure({
      error: new NodeVersionUnsupportedError({ runningVersion: '20.0.0' }),
    });

    const result = await capacityReadBroker({ diskPath });

    expect(result).toStrictEqual({
      suggestion: {
        suggestion: 1,
        cpuLimit: 1,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      },
      machine,
      liveLeases: [],
      resources: {
        maxMemoryPercent: 80,
        maxDiskMB: 4096,
      },
      warnings: ['node:sqlite needs Node 22.16 or newer (running 20.0.0)'],
    });
  });

  it('ERROR: {leaseListLive throws non-Error} => returns empty leases, captures string warning, and calculates suggestion', async () => {
    const proxy = capacityReadBrokerProxy();
    const diskPath = '/test/disk';
    const machine = MachineReadingStub();
    proxy.setupDefaults({ diskPath, machine });
    proxy.setupLeasesFailure({ error: 'corrupt registry' });

    const result = await capacityReadBroker({ diskPath });

    expect(result).toStrictEqual({
      suggestion: {
        suggestion: 1,
        cpuLimit: 1,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      },
      machine,
      liveLeases: [],
      resources: {
        maxMemoryPercent: 80,
        maxDiskMB: 4096,
      },
      warnings: ['corrupt registry'],
    });
  });

  it('VALID: {both limits and lease have warnings} => includes both warnings in returned list', async () => {
    const proxy = capacityReadBrokerProxy();
    const diskPath = '/test/disk';
    const machine = MachineReadingStub();
    const limitsWarning = 'config.json unparseable. Using defaults.';
    proxy.setupDefaults({ diskPath, machine, warning: limitsWarning });
    proxy.setupLeasesFailure({ error: 'registry missing' });

    const result = await capacityReadBroker({ diskPath });

    expect(result).toStrictEqual({
      suggestion: {
        suggestion: 1,
        cpuLimit: 1,
        freeMemoryLimit: null,
        capMemoryLimit: null,
      },
      machine,
      liveLeases: [],
      resources: {
        maxMemoryPercent: 80,
        maxDiskMB: 4096,
      },
      warnings: [limitsWarning, 'registry missing'],
    });
  });
});
