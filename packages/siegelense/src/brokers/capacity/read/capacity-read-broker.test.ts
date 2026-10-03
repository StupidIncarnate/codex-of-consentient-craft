import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';

import { capacityReadBroker } from './capacity-read-broker';
import { capacityReadBrokerProxy } from './capacity-read-broker.proxy';

const MB_BYTES = 1_048_576;
const NOW_MS = 1_700_000_000_000;
const VMSTAT_CONTENT = 'nr_free_pages 12345\noom_kill 0\n';
// Low enough that cpuAllows never binds against any memoryAllows/ceilingLeft value this file's
// non-CPU scenarios compute (8 cores − 0.5 load, floored, is comfortably above the ceiling of 3) —
// so these tests keep proving what they say they prove. The CPU-specific describe block below sets
// its own load instead.
const LOAD_AVG = [0.5, 0.3, 0.2] as const;
const SATURATED_LOAD_AVG = [33.56, 20.1, 10.4] as const;

describe('capacityReadBroker', () => {
  describe('two pool-size groups, never blended', () => {
    it('VALID: {poolSize: 1} => divides by the pool-size-1 group and reports it as the profile block', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [
            { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
            { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
          ],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });

    it('VALID: {poolSize: 3, same machine} => divides by the pool-size-3 group, so suggested is 1 rather than 2', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [
            { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
            { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
          ],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 3,
      });

      expect(answer).toStrictEqual({
        suggested: 1,
        ceiling: 3,
        why:
          'profile 2810MB peak / 1920MB steady at pool size 3, from 5 runs; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 3,
          steadyMB: 1920,
          peakMB: 2810,
          fromRuns: 5,
        },
      });
    });
  });

  describe('load this session did not create', () => {
    it('VALID: {empty fleet, 9000MB free} => suggested 3, the baseline the next test drops from', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 9000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 3,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 9000MB less 512MB headroom; nothing else up; ' +
          'capped at the policy ceiling of 3',
        measured: {
          freeMemMB: 9000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });

    it('VALID: {a foreign booted instance and a foreign reservation} => counts both and suggested drops from 3 to 1', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({
        registry: RegistryStub({
          instances: [
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_aaaa1111' }),
              owner: '99999',
              bootedAtMs: NOW_MS - 60_000,
              lastBeatMs: NOW_MS - 1000,
            }),
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_bbbb2222' }),
              owner: '88888',
              reservedAtMs: NOW_MS - 1000,
              bootedAtMs: null,
              lastBeatMs: null,
            }),
          ],
        }),
      });
      proxy.setupMachineReading({
        freeMemBytes: 9000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 1,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 9000MB less 512MB headroom and 2600MB for 1 still booting; ' +
          '2 siege instances already up (1 still reserving); ' +
          'capped at the policy ceiling of 3',
        measured: {
          freeMemMB: 9000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 2,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });

    it('EDGE: {an alive row whose heartbeat went cold} => excluded from the count rather than reaped', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({
        registry: RegistryStub({
          instances: [
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_cccc3333' }),
              owner: '77777',
              bootedAtMs: NOW_MS - 600_000,
              lastBeatMs: NOW_MS - 60_000,
            }),
          ],
        }),
      });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });

    it('EDGE: {a reservation past its own staleAfterMs window} => excluded from the count rather than counted forever', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({
        registry: RegistryStub({
          instances: [
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_a620d5f3' }),
              owner: '55555',
              bootedAtMs: null,
              lastBeatMs: null,
              // 4.5 hours past NOW_MS's reservedAtMs — well past
              // instanceLifecycleStatics.reservation.staleAfterMs (300_000ms / 5m), the exact
              // shape a reservation abandoned before boot.lock or the driver's own ping ever
              // fired takes. isStaleRegistryEntryGuard alone never catches this row: lastBeatMs
              // is null, and that guard returns false for a heartbeat that never started.
              reservedAtMs: NOW_MS - 16_200_000,
            }),
          ],
        }),
      });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });

    it('EDGE: {killed and pruned tombstones} => neither counts as load', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({
        registry: RegistryStub({
          instances: [
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_dddd4444' }),
              state: 'killed',
              bootedAtMs: NOW_MS - 600_000,
              lastBeatMs: NOW_MS - 1000,
            }),
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_eeee5555' }),
              state: 'pruned',
              prunedAtMs: NOW_MS - 500,
              prunedByRule: 'older-than',
            }),
          ],
        }),
      });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {samples: []} => suggested 2, profile null, and a why that explains the default and how to measure one', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [],
          fromRuns: 0,
          measuredAt: null,
          bootMs: null,
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: null,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'no measured profile for api, so this suggests the default of 2 instances; ' +
          'run a pool of 2 once and siegelense records a profile for next time; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: null,
      });
    });

    it('EMPTY: {no profile, --spec stack} => the why names the spec that was asked about', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupNoProfile();
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'stack',
        poolSize: null,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'no measured profile for stack, so this suggests the default of 2 instances; ' +
          'run a pool of 2 once and siegelense records a profile for next time; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: null,
      });
    });

    it('VALID: {samples: [], --pool 5} => the why says --pool had no effect because no profile exists yet', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [],
          fromRuns: 0,
          measuredAt: null,
          bootMs: null,
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 5,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'no measured profile for api, so --pool 5 has no effect: this suggests the default of 2 instances; ' +
          'run a pool of 2 once and siegelense records a profile for next time; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: null,
      });
    });

    it('EDGE: {a measured profile, --pool 99999 with no matching group} => the why names which pool size was used instead', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 9000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 99_999,
      });

      expect(answer).toStrictEqual({
        suggested: 3,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          '--pool 99999 has no measured group, so pool size 1 was used instead; ' +
          'free RAM 9000MB less 512MB headroom; nothing else up; ' +
          'capped at the policy ceiling of 3',
        measured: {
          freeMemMB: 9000,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });
  });

  describe('a machine that plainly cannot hold another', () => {
    it('EDGE: {free memory one MB under peak plus headroom} => suggested 0 with a why naming the shortfall', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 3111 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 3111MB less 512MB headroom; nothing else up; ' +
          'no room for one more: 2599MB available is under the 2600MB this spec peaks at',
        measured: {
          freeMemMB: 3111,
          cores: 8,
          loadAvg1: 0.5,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });
  });

  describe('a saturated CPU', () => {
    it('EDGE: {load 33.56 across 12 cores, memory and ceiling roomy} => CPU throttles suggested to 1, named in the why', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 21_053 * MB_BYTES,
        totalMemBytes: 32_000 * MB_BYTES,
        coreCount: 12,
        loadAvg: SATURATED_LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      expect(answer).toStrictEqual({
        suggested: 1,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 21053MB less 512MB headroom; nothing else up; ' +
          'load 33.56 across 12 cores allows only 1; CPU, not memory, is the limit',
        measured: {
          freeMemMB: 21_053,
          cores: 12,
          loadAvg1: 33.56,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'api',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });
  });

  describe('other-tool starting leases', () => {
    it('VALID: {ward starting lease} => debits expectedPeakMB from available memory', async () => {
      const proxy = capacityReadBrokerProxy();
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupMachineReading({
        freeMemBytes: 5000 * MB_BYTES,
        totalMemBytes: 16_000 * MB_BYTES,
        coreCount: 8,
        loadAvg: LOAD_AVG,
        diskBavail: 41_000,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT,
      });
      proxy.setupLeases({
        leases: [
          {
            leaseId: 'ward-lease-1',
            tool: 'ward',
            label: '@dungeonmaster/web',
            ownerPid: 99_999,
            state: 'starting',
            expectedPeakMB: 2000,
          },
        ],
      });
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'api',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        repoRoot: '/default/cwd',
        specName: 'api',
        poolSize: 1,
      });

      // Free RAM is 5000 - 512 (headroom) - 2000 (ward starting lease) = 2488 MB.
      // Since 2488 < 2600 (peakMB), memoryAllows is 0, so suggested is 0.
      expect(answer.suggested).toBe(0);
    });
  });
});
