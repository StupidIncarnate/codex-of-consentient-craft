/**
 * PURPOSE: Composes the three reads `capacityReadBroker` makes, behind scenario methods a test calls
 * in the SAME order the broker reaches them — `setupRegistry`, then `setupMachineReading`, then
 * `setupProfile`, then `setupNow`. `registryReadBroker` and `machineReadBroker` run REAL down to
 * their own adapters, and each queues its own one-shot path resolutions onto the shared
 * `pathJoinAdapter`, so calling the two setups out of order hands the wrong resolution to the wrong
 * caller (`statusReadBrokerProxy` documents the same hazard for the same two brokers).
 *
 * `profileReadBroker` runs real too: `setupProfile` stages the default `api` spec's profile tree from
 * the `SpecProfile`'s `samples` (one record per run), and `setupNoProfile` stages a spec nothing
 * has ever run.
 *
 * USAGE:
 * const proxy = capacityReadBrokerProxy();
 * proxy.setupRegistry({ registry });
 * proxy.setupMachineReading({ freeMemBytes, totalMemBytes, coreCount, loadAvg, diskBavail, diskBsize, vmstatContent });
 * proxy.setupProfile({ profile });
 * proxy.setupNow({ nowMs });
 */

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { leaseListLiveBrokerProxy } from '@dungeonmaster/load-balancer/brokers/lease/list-live/lease-list-live-broker.proxy';
import { machineReadBrokerProxy } from '@dungeonmaster/load-balancer/brokers/machine/read/machine-read-broker.proxy';
import { profileReadBrokerProxy } from '../../profile/read/profile-read-broker.proxy';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;
type Registry = ReturnType<typeof RegistryStub>;
type SpecProfile = ReturnType<typeof SpecProfileStub>;

const HOME_DIR = '/home/user';
const HOME_PATH = '/home/user/.dungeonmaster';
const DEFAULT_TIMESTAMP_MS = 1_700_000_000_000;

export const capacityReadBrokerProxy = ({
  database,
}: {
  database?: DatabaseSync;
} = {}): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupMachineReading: (params: {
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
    vmstatContent: string;
  }) => void;
  setupLeases: (params: {
    leases: readonly {
      leaseId: string;
      tool: 'ward' | 'siegelense';
      label: string;
      ownerPid: number;
      state: 'starting' | 'running';
      expectedPeakMB?: number | null;
      currentRssMB?: number | null;
      startedAtMs?: number;
      lastBeatMs?: number;
    }[];
  }) => void;
  setupProfile: (params: { profile: SpecProfile }) => void;
  setupNoProfile: () => void;
  setupNow: (params: { nowMs: number }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  dmHomeProxy.setupHomePath({ homeDir: HOME_DIR, homePath: HOME_PATH });

  const registryProxy = registryReadBrokerProxy();
  const machineProxy = machineReadBrokerProxy();
  const leaseProxy = leaseListLiveBrokerProxy();
  const profileProxy = profileReadBrokerProxy();
  const nowHandle = registerSpyOn({ object: Date, method: 'now' });

  const { database: leaseDatabase } = leaseProxy.setupDatabase({
    ...(database === undefined ? {} : { database }),
    homeDir: HOME_DIR,
  });

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      registryProxy.setupPresentRegistry({ content: JSON.stringify(registry) });
    },

    setupMachineReading: (params: {
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      diskBavail: number;
      diskBsize: number;
      vmstatContent: string;
    }): void => {
      machineProxy.setupMachineReading({
        diskPath: HOME_PATH,
        ...params,
      });
    },

    setupLeases: ({ leases }): void => {
      const insert = leaseDatabase.prepare(
        'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      );
      for (const lease of leases) {
        insert.run(
          lease.leaseId,
          lease.tool,
          lease.label,
          lease.ownerPid,
          lease.state,
          lease.expectedPeakMB ?? null,
          lease.currentRssMB ?? null,
          lease.startedAtMs ?? DEFAULT_TIMESTAMP_MS,
          lease.lastBeatMs ?? DEFAULT_TIMESTAMP_MS,
        );
        leaseProxy.setupProcessAlive({ pid: lease.ownerPid });
      }
    },

    setupProfile: ({ profile }: { profile: SpecProfile }): void => {
      profileProxy.setupSpecProfile({ profile });
    },

    setupNoProfile: (): void => {
      profileProxy.setupNoProfileForAnySpec();
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },
  };
};
