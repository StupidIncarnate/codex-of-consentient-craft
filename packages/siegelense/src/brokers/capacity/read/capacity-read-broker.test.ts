import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceOwnerStub } from '../../../contracts/instance-owner/instance-owner.stub';
import { ProfilePoolSizeStub } from '../../../contracts/profile-pool-size/profile-pool-size.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';

import { capacityReadBroker } from './capacity-read-broker';
import { capacityReadBrokerProxy } from './capacity-read-broker.proxy';

const MB_BYTES = 1_048_576;
const NOW_MS = 1_700_000_000_000;
const VMSTAT_CONTENT = 'nr_free_pages 12345\noom_kill 0\n';
const LOAD_AVG = [4.2, 3.1, 2.0] as const;

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
          specName: 'dungeonmaster-stack',
          samples: [
            { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
            { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
          ],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        poolSize: ProfilePoolSizeStub({ value: 1 }),
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
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
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
          specName: 'dungeonmaster-stack',
          samples: [
            { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
            { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
          ],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        poolSize: ProfilePoolSizeStub({ value: 3 }),
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
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
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
          specName: 'dungeonmaster-stack',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        poolSize: ProfilePoolSizeStub({ value: 1 }),
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
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
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
              owner: InstanceOwnerStub({ value: '99999' }),
              bootedAtMs: EpochMsStub({ value: NOW_MS - 60_000 }),
              lastBeatMs: EpochMsStub({ value: NOW_MS - 1000 }),
            }),
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_bbbb2222' }),
              owner: InstanceOwnerStub({ value: '88888' }),
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
          specName: 'dungeonmaster-stack',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        poolSize: ProfilePoolSizeStub({ value: 1 }),
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
          loadAvg1: 4.2,
          siegeInstances: 2,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
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
              owner: InstanceOwnerStub({ value: '77777' }),
              bootedAtMs: EpochMsStub({ value: NOW_MS - 600_000 }),
              lastBeatMs: EpochMsStub({ value: NOW_MS - 60_000 }),
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
          specName: 'dungeonmaster-stack',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        poolSize: ProfilePoolSizeStub({ value: 1 }),
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
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
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
              bootedAtMs: EpochMsStub({ value: NOW_MS - 600_000 }),
              lastBeatMs: EpochMsStub({ value: NOW_MS - 1000 }),
            }),
            RegistryEntryStub({
              id: InstanceIdStub({ value: 'inst_eeee5555' }),
              state: 'pruned',
              prunedAtMs: EpochMsStub({ value: NOW_MS - 500 }),
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
          specName: 'dungeonmaster-stack',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        poolSize: ProfilePoolSizeStub({ value: 1 }),
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
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {samples: [], specName: null} => suggested 2, profile null, and a why that says the pair profiles itself', async () => {
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
          specName: 'dungeonmaster-stack',
          samples: [],
          fromRuns: 0,
          measuredAt: null,
          bootMs: null,
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({ specName: null, poolSize: null });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'no measured profile for dungeonmaster-stack, so the default pair of 2 profiles itself; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: null,
      });
    });

    it('EMPTY: {samples: [], --spec dungeonmaster-api} => the why names the spec that was asked about', async () => {
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
          specName: 'dungeonmaster-api',
          samples: [],
          fromRuns: 0,
          measuredAt: null,
          bootMs: null,
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-api' }),
        poolSize: null,
      });

      expect(answer).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'no measured profile for dungeonmaster-api, so the default pair of 2 profiles itself; ' +
          'free RAM 5000MB less 512MB headroom; nothing else up',
        measured: {
          freeMemMB: 5000,
          cores: 8,
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: null,
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
          specName: 'dungeonmaster-stack',
          samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 }],
        }),
      });
      proxy.setupNow({ nowMs: NOW_MS });

      const answer = await capacityReadBroker({
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        poolSize: ProfilePoolSizeStub({ value: 1 }),
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
          loadAvg1: 4.2,
          siegeInstances: 0,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });
  });
});
