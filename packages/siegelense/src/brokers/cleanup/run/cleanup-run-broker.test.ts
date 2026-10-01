import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { cleanupRunBroker } from './cleanup-run-broker';
import { cleanupRunBrokerProxy } from './cleanup-run-broker.proxy';

// instanceKillBrokerProxy (composed transitively through cleanupRunBrokerProxy) stamps Date.now()
// to exactly this value at construction, so every test below reads its own NOW_MS off the same
// stub rather than re-mocking the clock itself.
const NOW_MS = 1_700_000_000_000;

const LIVE_ID = InstanceIdStub({ value: 'inst_7f3a' });
const STALE_ID = InstanceIdStub({ value: 'inst_9b2c' });
const RESERVED_ID = InstanceIdStub({ value: 'inst_1d09' });
const ABANDONED_RESERVATION_ID = InstanceIdStub({ value: 'inst_65f30f20' });

const HOME_DIR = '/home/user';
const HOME_PATH = `${HOME_DIR}/.dungeonmaster`;
const ROOT_PATH = `${HOME_PATH}/siegelense`;

const STALE_SOCKET_PATH = `/tmp/dm-siege-sockets/${STALE_ID}.sock`;
const STALE_EVIDENCE_PATH = `/home/user/.dungeonmaster/siegelense/unowned/instances/${STALE_ID}`;
const STALE_HOME_PATH = `/tmp/dm-siege-${STALE_ID}`;

const ABANDONED_RESERVATION_SOCKET_PATH = `/tmp/dm-siege-sockets/${ABANDONED_RESERVATION_ID}.sock`;
const ABANDONED_RESERVATION_HOME_PATH = `/tmp/dm-siege-${ABANDONED_RESERVATION_ID}`;
const ABANDONED_RESERVATION_EVIDENCE_PATH = `/home/user/.dungeonmaster/siegelense/unowned/instances/${ABANDONED_RESERVATION_ID}`;

describe('cleanupRunBroker', () => {
  describe('a mixed fleet', () => {
    it('VALID: {one live, one stale, one reserved} => only the stale one is reaped; the other two are in leftAlone with their own reasons', async () => {
      const proxy = cleanupRunBrokerProxy();

      const liveEntry = RegistryEntryStub({
        id: LIVE_ID,
        bootedAtMs: NOW_MS - 900_000,
        lastBeatMs: NOW_MS - 2000,
      });
      const pgidOne = 33_812;
      const pgidTwo = 33_840;
      const staleEntry = RegistryEntryStub({
        id: STALE_ID,
        socketPath: STALE_SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
        bootedAtMs: NOW_MS - 32_400_000,
        lastBeatMs: NOW_MS - 32_400_000,
      });
      const reservedEntry = RegistryEntryStub({
        id: RESERVED_ID,
        bootedAtMs: null,
        lastBeatMs: null,
        reservedAtMs: NOW_MS - 5000,
      });
      proxy.setupRegistry({
        registry: RegistryStub({ instances: [liveEntry, staleEntry, reservedEntry] }),
      });

      proxy.setupDriverUnreachableReapsLivePgids({
        socketPath: STALE_SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
        homePath: STALE_HOME_PATH,
      });
      proxy.setupShutdownReasonWriteSucceeds({ evidencePath: STALE_EVIDENCE_PATH });
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: STALE_EVIDENCE_PATH,
      });
      proxy.setupDir({
        dirPath: `${STALE_EVIDENCE_PATH}/runs`,
        entries: [],
      });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [{ id: STALE_ID, staleFor: '9h', killed: [pgidOne, pgidTwo], homeRemoved: true }],
        portsReleased: [staleEntry.ports.api, staleEntry.ports.web],
        lockReleaseOutcome: 'none-held',
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [
          { id: LIVE_ID, why: 'live — last beat 2s ago' },
          { id: RESERVED_ID, why: 'reserved — booting, no beat yet' },
        ],
      });
    });
  });

  describe('an abandoned reservation', () => {
    it('VALID: {pid: null, no beat, reservedAtMs well past the ceiling} => reaped and its ports are released', async () => {
      const proxy = cleanupRunBrokerProxy();

      const abandonedEntry = RegistryEntryStub({
        id: ABANDONED_RESERVATION_ID,
        pid: null,
        socketPath: null,
        bootedAtMs: null,
        lastBeatMs: null,
        // 10 minutes ago — past instanceLifecycleStatics.reservation.staleAfterMs (300_000ms / 5m),
        // the ceiling built from bootLock.waitCeilingMs + driverStatics.boot.defaultTimeoutMs.
        reservedAtMs: NOW_MS - 600_000,
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [abandonedEntry] }) });
      proxy.setupDriverUnreachableNoPgids({
        socketPath: ABANDONED_RESERVATION_SOCKET_PATH,
        homePath: ABANDONED_RESERVATION_HOME_PATH,
      });
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: ABANDONED_RESERVATION_EVIDENCE_PATH,
      });
      proxy.setupDir({
        dirPath: `${ABANDONED_RESERVATION_EVIDENCE_PATH}/runs`,
        entries: [],
      });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [{ id: ABANDONED_RESERVATION_ID, staleFor: '10m', killed: [], homeRemoved: true }],
        portsReleased: [abandonedEntry.ports.api, abandonedEntry.ports.web],
        lockReleaseOutcome: 'none-held',
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });
    });
  });

  describe('a reservation still inside its boot window', () => {
    it('VALID: {reservedAtMs seconds ago, no beat yet} => stays in leftAlone, is NOT reaped', async () => {
      const proxy = cleanupRunBrokerProxy();

      const freshReservation = RegistryEntryStub({
        id: RESERVED_ID,
        bootedAtMs: null,
        lastBeatMs: null,
        // Seconds old — nowhere near instanceLifecycleStatics.reservation.staleAfterMs (5m). A
        // real boot in flight looks exactly like this, and reaping it here would kill it.
        reservedAtMs: NOW_MS - 5000,
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [freshReservation] }) });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleaseOutcome: 'none-held',
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [{ id: RESERVED_ID, why: 'reserved — booting, no beat yet' }],
      });
      // The registry write path is only reachable through a reap, and nothing was reaped here.
      expect(proxy.getReleasedRegistry()).toBe(undefined);
    });
  });

  describe('the reaped row survives as a tombstone', () => {
    it('VALID: {a reaped instance} => its registry row is killed, not deleted', async () => {
      const proxy = cleanupRunBrokerProxy();

      const pgidOne = 33_812;
      const staleEntry = RegistryEntryStub({
        id: STALE_ID,
        socketPath: STALE_SOCKET_PATH,
        pgids: [pgidOne],
        bootedAtMs: NOW_MS - 32_400_000,
        lastBeatMs: NOW_MS - 32_400_000,
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [staleEntry] }) });

      proxy.setupDriverUnreachableReapsLivePgids({
        socketPath: STALE_SOCKET_PATH,
        pgids: [pgidOne],
        homePath: STALE_HOME_PATH,
      });
      proxy.setupShutdownReasonWriteSucceeds({ evidencePath: STALE_EVIDENCE_PATH });
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: STALE_EVIDENCE_PATH,
      });
      proxy.setupDir({
        dirPath: `${STALE_EVIDENCE_PATH}/runs`,
        entries: [],
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
            killedAtMs: NOW_MS,
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
        bootedAtMs: NOW_MS - 900_000,
        lastBeatMs: NOW_MS - 2000,
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [liveEntry] }) });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleaseOutcome: 'none-held',
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [{ id: LIVE_ID, why: 'live — last beat 2s ago' }],
      });
      // The registry write path is only reachable through a reap, and nothing was reaped here —
      // an unaddressed call log reads back empty rather than throwing, which is what proves the
      // live row's bytes were never touched.
      expect(proxy.getReleasedRegistry()).toBe(undefined);
    });
  });

  describe('an empty registry', () => {
    it('EMPTY: {empty registry} => every field empty, lockReleaseOutcome none-held', async () => {
      const proxy = cleanupRunBrokerProxy();

      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupNoLocks();

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleaseOutcome: 'none-held',
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });
    });
  });

  describe('a stale boot.lock', () => {
    it('VALID: {a boot.lock past its TTL, empty registry} => lockReleaseOutcome released', async () => {
      const proxy = cleanupRunBrokerProxy();

      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupBootLockStale({ acquiredAtMs: NOW_MS - 46_000 });

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleaseOutcome: 'released',
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });
    });
  });

  describe('a stale boot.lock whose removal fails', () => {
    it('ERROR: {a boot.lock past its TTL whose removal fails, empty registry} => lockReleaseOutcome failed', async () => {
      const proxy = cleanupRunBrokerProxy();

      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
      proxy.setupBootLockUnlinkFails({ acquiredAtMs: NOW_MS - 46_000 });

      const result = await cleanupRunBroker();

      expect(result).toStrictEqual({
        reaped: [],
        portsReleased: [],
        lockReleaseOutcome: 'failed',
        assetsAged: { instances: 0, freedMB: 0 },
        leftAlone: [],
      });
    });
  });
});
