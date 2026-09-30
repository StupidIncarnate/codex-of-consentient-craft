
import { instanceKillBroker } from './instance-kill-broker';
import { instanceKillBrokerProxy } from './instance-kill-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';

const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });
const SOCKET_PATH_VALUE = `/tmp/dm-siege-sockets/${INSTANCE_ID}.sock`;
const SOCKET_PATH = SOCKET_PATH_VALUE;
const EVIDENCE_PATH = `/home/user/.dungeonmaster/siegelense/unowned/instances/${INSTANCE_ID}`;
const HOME_PATH = `/tmp/dm-siege-${INSTANCE_ID}`;

describe('instanceKillBroker', () => {
  describe('driver answers', () => {
    it('VALID: {kill, driver answers} => returns stopped true and the socket got exactly one kill request', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverStops({ socketPath: SOCKET_PATH });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.stopped).toBe(true);
      expect(proxy.getConnectionCountFor({ socketPath: SOCKET_PATH })).toBe(1);
    });

    it('VALID: {kill, driver answers} => never passes the evidence path to anything that removes', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverStops({ socketPath: SOCKET_PATH });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.evidenceKept.path).toBe(
        '/default/cwd/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21',
      );
      expect(proxy.getRemovedPaths()).toStrictEqual([]);
    });

    it("VALID: {kill, driver's teardown stopped two groups} => surfaces them as `killed`, distinct from reapedPgids", async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      const pgidOne = ProcessGroupIdStub({ value: 45_714 });
      const pgidTwo = ProcessGroupIdStub({ value: 45_716 });
      proxy.setupDriverStops({ socketPath: SOCKET_PATH, killed: [pgidOne, pgidTwo] });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect({ killed: result.killed, reapedPgids: result.reapedPgids }).toStrictEqual({
        killed: [pgidOne, pgidTwo],
        reapedPgids: [],
      });
    });

    it('VALID: {kill, driver answers with a malformed payload} => still reports stopped true, with nothing killed', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverStopsWithMalformedPayload({ socketPath: SOCKET_PATH });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect({ stopped: result.stopped, killed: result.killed }).toStrictEqual({
        stopped: true,
        killed: undefined,
      });
    });
  });

  describe('driver unreachable, row still alive', () => {
    it("VALID: {kill, socket refused} => reaps the registry row's own live pgids and returns them in reapedPgids", async () => {
      const proxy = instanceKillBrokerProxy();
      const pgidOne = ProcessGroupIdStub({ value: 4821 });
      const pgidTwo = ProcessGroupIdStub({ value: 4822 });
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableReapsLivePgids({
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
        homePath: HOME_PATH,
      });
      proxy.setupShutdownReasonWriteSucceeds({ evidencePath: EVIDENCE_PATH });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.reapedPgids).toStrictEqual([pgidOne, pgidTwo]);
      // SIGTERM, then SIGKILL once the grace probe still sees it alive — the same escalation
      // `laneTeardownBroker` runs against a genuinely live group.
      expect(proxy.getKillGroupCallsFor({ pgid: pgidOne })).toStrictEqual(['SIGTERM', 'SIGKILL']);
      expect(proxy.getKillGroupCallsFor({ pgid: pgidTwo })).toStrictEqual(['SIGTERM', 'SIGKILL']);
    });

    it('VALID: {kill, socket refused, two live pgids reaped} => overwrites shutdown-reason.json so status shows the explicit kill, not a stale idle-reap reason', async () => {
      const proxy = instanceKillBrokerProxy();
      const pgidOne = ProcessGroupIdStub({ value: 4821 });
      const pgidTwo = ProcessGroupIdStub({ value: 4822 });
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableReapsLivePgids({
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
        homePath: HOME_PATH,
      });
      proxy.setupShutdownReasonWriteSucceeds({ evidencePath: EVIDENCE_PATH });

      await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(proxy.getWrittenShutdownReason({ evidencePath: EVIDENCE_PATH })).toStrictEqual({
        reason: 'reaped 2 orphaned process groups outside the idle timeout',
        atMs: 1.valueOf(),
      });
    });

    it('VALID: {kill, socket refused, a caller-supplied reason, two live pgids reaped} => writes the SUPPLIED reason, not the generic wording', async () => {
      const proxy = instanceKillBrokerProxy();
      const pgidOne = ProcessGroupIdStub({ value: 4821 });
      const pgidTwo = ProcessGroupIdStub({ value: 4822 });
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableReapsLivePgids({
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
        homePath: HOME_PATH,
      });
      proxy.setupShutdownReasonWriteSucceeds({ evidencePath: EVIDENCE_PATH });

      await instanceKillBroker({
        instanceId: INSTANCE_ID,
        reason: 'reaped by cleanup after its heartbeat went stale',
      });

      expect(proxy.getWrittenShutdownReason({ evidencePath: EVIDENCE_PATH })).toStrictEqual({
        reason: 'reaped by cleanup after its heartbeat went stale',
        atMs: 1.valueOf(),
      });
    });

    it('VALID: {kill, socket refused, no pgids recorded} => never writes shutdown-reason.json, since nothing was reaped', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH, pgids: [] });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableNoPgids({ socketPath: SOCKET_PATH, homePath: HOME_PATH });

      await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(proxy.getWrittenShutdownReason({ evidencePath: EVIDENCE_PATH })).toBe(null);
    });

    it('VALID: {kill, socket refused} => removes the throwaway home, never the evidence directory', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH, pgids: [] });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableNoPgids({ socketPath: SOCKET_PATH, homePath: HOME_PATH });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.reapedPgids).toStrictEqual([]);
      expect(proxy.getRemovedPaths()).toStrictEqual([HOME_PATH]);
    });

    it('VALID: {kill, socket refused, a recorded pgid already gone} => never signals it, and it is excluded from reapedPgids', async () => {
      const proxy = instanceKillBrokerProxy();
      const alreadyGonePgid = ProcessGroupIdStub({ value: 5001 });
      const livePgid = ProcessGroupIdStub({ value: 5002 });
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        pgids: [alreadyGonePgid, livePgid],
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableSomeAlreadyGone({
        socketPath: SOCKET_PATH,
        livePgids: [livePgid],
        alreadyGonePgids: [alreadyGonePgid],
        homePath: HOME_PATH,
      });
      proxy.setupShutdownReasonWriteSucceeds({ evidencePath: EVIDENCE_PATH });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.reapedPgids).toStrictEqual([livePgid]);
      expect(proxy.getKillGroupCallsFor({ pgid: alreadyGonePgid })).toStrictEqual([]);
    });
  });

  describe('an instance already at rest', () => {
    // Every stored state other than 'alive' — 'unknown' is never a STORED registry row (it answers
    // a missing one), so it has no place in a table of rows this broker might be asked to kill.
    const NON_ALIVE_STATES = ['killed', 'dead', 'pruned', 'unusable'] as const;

    it.each(NON_ALIVE_STATES)(
      'VALID: {registry state: %s, stale pgids still recorded} => reports nothing reaped rather than re-signalling them',
      async (state) => {
        const proxy = instanceKillBrokerProxy();
        const pgidOne = ProcessGroupIdStub({ value: 104_541 });
        const pgidTwo = ProcessGroupIdStub({ value: 104_543 });
        const entry = RegistryEntryStub({
          id: INSTANCE_ID,
          socketPath: null,
          state,
          pgids: [pgidOne, pgidTwo],
        });
        proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

        const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

        expect(result.reapedPgids).toStrictEqual([]);
        expect(proxy.getKillGroupCallsFor({ pgid: pgidOne })).toStrictEqual([]);
        expect(proxy.getKillGroupCallsFor({ pgid: pgidTwo })).toStrictEqual([]);
      },
    );

    it('VALID: {kill, already killed} => still reports stopped true and accepts the id rather than refusing', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: null, state: 'killed' });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.stopped).toBe(true);
    });
  });
});
