import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { cleanupRunBroker } from './cleanup-run-broker';
import { cleanupRunBrokerProxy } from './cleanup-run-broker.proxy';

// instanceKillBrokerProxy (composed transitively through cleanupRunBrokerProxy) stamps Date.now()
// to exactly this value at construction, so every test below reads its own NOW_MS off the same
// stub rather than re-mocking the clock itself.
const NOW_MS = EpochMsStub();

const LIVE_ID = InstanceIdStub({ value: 'inst_7f3a' });
const STALE_ID = InstanceIdStub({ value: 'inst_9b2c' });
const RESERVED_ID = InstanceIdStub({ value: 'inst_1d09' });

const STALE_SOCKET_PATH = AbsoluteFilePathStub({ value: `/tmp/dm-siege-sockets/${STALE_ID}.sock` });
const STALE_EVIDENCE_PATH = AbsoluteFilePathStub({
  value: `/home/user/.dungeonmaster/siegelense/unowned/instances/${STALE_ID}`,
});
const STALE_HOME_PATH = AbsoluteFilePathStub({ value: `/tmp/dm-siege-${STALE_ID}` });
const STALE_HEARTBEAT_PATH = AbsoluteFilePathStub({
  value: `${String(STALE_EVIDENCE_PATH)}/heartbeat.json`,
});

describe('cleanupRunBroker', () => {
  describe('a mixed fleet', () => {
    it('VALID: {one live, one stale, one reserved} => only the stale one is reaped; the other two are in leftAlone with their own reasons', async () => {
      const proxy = cleanupRunBrokerProxy();

      const liveEntry = RegistryEntryStub({
        id: LIVE_ID,
        bootedAtMs: EpochMsStub({ value: NOW_MS - 900_000 }),
        lastBeatMs: EpochMsStub({ value: NOW_MS - 2000 }),
      });
      const staleEntry = RegistryEntryStub({
        id: STALE_ID,
        socketPath: STALE_SOCKET_PATH,
        bootedAtMs: EpochMsStub({ value: NOW_MS - 32_400_000 }),
        lastBeatMs: EpochMsStub({ value: NOW_MS - 32_400_000 }),
      });
      const reservedEntry = RegistryEntryStub({
        id: RESERVED_ID,
        bootedAtMs: null,
        lastBeatMs: null,
      });
      proxy.setupRegistry({
        registry: RegistryStub({ instances: [liveEntry, staleEntry, reservedEntry] }),
      });

      const pgidOne = ProcessGroupIdStub({ value: 33_812 });
      const pgidTwo = ProcessGroupIdStub({ value: 33_840 });
      const heartbeat = InstanceHeartbeatStub({ instanceId: STALE_ID, pgids: [pgidOne, pgidTwo] });
      proxy.setupDriverUnreachable({
        socketPath: STALE_SOCKET_PATH,
        heartbeatPath: STALE_HEARTBEAT_PATH,
        heartbeat,
        homePath: STALE_HOME_PATH,
      });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [{ id: STALE_ID, staleFor: '9h', killed: [pgidOne, pgidTwo], homeRemoved: true }],
        portsReleased: [staleEntry.ports.api, staleEntry.ports.web],
        lockReleased: false,
        leftAlone: [
          { id: LIVE_ID, why: 'live — last beat 2s ago' },
          { id: RESERVED_ID, why: 'reserved — booting, no beat yet' },
        ],
      });
    });
  });

  describe('the reaped row survives as a tombstone', () => {
    it('VALID: {a reaped instance} => its registry row is killed, not deleted', async () => {
      const proxy = cleanupRunBrokerProxy();

      const staleEntry = RegistryEntryStub({
        id: STALE_ID,
        socketPath: STALE_SOCKET_PATH,
        bootedAtMs: EpochMsStub({ value: NOW_MS - 32_400_000 }),
        lastBeatMs: EpochMsStub({ value: NOW_MS - 32_400_000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [staleEntry] }) });

      const pgidOne = ProcessGroupIdStub({ value: 33_812 });
      const heartbeat = InstanceHeartbeatStub({ instanceId: STALE_ID, pgids: [pgidOne] });
      proxy.setupDriverUnreachable({
        socketPath: STALE_SOCKET_PATH,
        heartbeatPath: STALE_HEARTBEAT_PATH,
        heartbeat,
        homePath: STALE_HOME_PATH,
      });
      proxy.setupNoLocks();

      await cleanupRunBroker();

      expect(proxy.getReleasedRegistry()).toStrictEqual({
        instances: [
          RegistryEntryStub({
            ...staleEntry,
            state: 'killed',
            pid: null,
            pgids: [],
            socketPath: null,
          }),
        ],
      });
    });
  });

  describe('a live instance', () => {
    it('VALID: {only a live instance} => cleanup never writes to the registry', async () => {
      const proxy = cleanupRunBrokerProxy();

      const liveEntry = RegistryEntryStub({
        id: LIVE_ID,
        bootedAtMs: EpochMsStub({ value: NOW_MS - 900_000 }),
        lastBeatMs: EpochMsStub({ value: NOW_MS - 2000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [liveEntry] }) });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        leftAlone: [{ id: LIVE_ID, why: 'live — last beat 2s ago' }],
      });
      // The registry write path is only reachable through a reap, and nothing was reaped here —
      // an unaddressed call log reads back empty rather than throwing, which is what proves the
      // live row's bytes were never touched.
      expect(proxy.getReleasedRegistry()).toBe(undefined);
    });
  });

  describe('an empty registry', () => {
    it('EMPTY: {empty registry} => every field empty, lockReleased false', async () => {
      const proxy = cleanupRunBrokerProxy();

      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: false,
        leftAlone: [],
      });
    });
  });

  describe('a stale boot.lock', () => {
    it('VALID: {a boot.lock past its TTL, empty registry} => lockReleased true', async () => {
      const proxy = cleanupRunBrokerProxy();

      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupBootLockStale({ acquiredAtMs: EpochMsStub({ value: NOW_MS - 46_000 }) });

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleased: true,
        leftAlone: [],
      });
    });
  });
});
