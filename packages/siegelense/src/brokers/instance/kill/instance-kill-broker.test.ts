import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { instanceKillBroker } from './instance-kill-broker';
import { instanceKillBrokerProxy } from './instance-kill-broker.proxy';
import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';

const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });
const SOCKET_PATH_VALUE = `/tmp/dm-siege-sockets/${INSTANCE_ID}.sock`;
const SOCKET_PATH = AbsoluteFilePathStub({ value: SOCKET_PATH_VALUE });
const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: `/home/user/.dungeonmaster/siegelense/unowned/instances/${INSTANCE_ID}`,
});
const HOME_PATH = AbsoluteFilePathStub({ value: `/tmp/dm-siege-${INSTANCE_ID}` });

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
        '/default/cwd/.siegelense/unowned/instances/inst_7f3a9c21',
      );
      expect(proxy.getRemovedPaths()).toStrictEqual([]);
    });
  });

  describe('driver unreachable', () => {
    it('ERROR: {kill, socket refused} => reaps the heartbeat pgids and returns them in reapedPgids', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const pgidOne = ProcessGroupIdStub({ value: 4821 });
      const pgidTwo = ProcessGroupIdStub({ value: 4822 });
      const heartbeat = InstanceHeartbeatStub({
        instanceId: INSTANCE_ID,
        pgids: [pgidOne, pgidTwo],
      });
      const heartbeatPath = AbsoluteFilePathStub({
        value: `${String(EVIDENCE_PATH)}/heartbeat.json`,
      });
      proxy.setupDriverUnreachable({
        socketPath: SOCKET_PATH,
        heartbeatPath,
        heartbeat,
        homePath: HOME_PATH,
      });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.reapedPgids).toStrictEqual([pgidOne, pgidTwo]);
      // The second entry (signal 0) is processIsAliveAdapter's own aliveness probe, sharing this
      // same negated-pgid target with processKillGroupAdapter's SIGTERM — both go through the
      // same underlying `kill`, so a full accounting of what reached this pgid includes it: SIGTERM
      // sent, found gone on the probe, and SIGKILL correctly never escalated to.
      expect(proxy.getKillGroupCallsFor({ pgid: pgidOne })).toStrictEqual(['SIGTERM', 0]);
      expect(proxy.getKillGroupCallsFor({ pgid: pgidTwo })).toStrictEqual(['SIGTERM', 0]);
    });

    it('VALID: {kill, socket refused} => removes the throwaway home, never the evidence directory', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const heartbeatPath = AbsoluteFilePathStub({
        value: `${String(EVIDENCE_PATH)}/heartbeat.json`,
      });
      proxy.setupDriverUnreachableNoHeartbeat({
        socketPath: SOCKET_PATH,
        heartbeatPath,
        homePath: HOME_PATH,
      });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.reapedPgids).toStrictEqual([]);
      expect(proxy.getRemovedPaths()).toStrictEqual([HOME_PATH]);
    });

    it('VALID: {kill, driver already dead} => accepts the dead instance id rather than refusing', async () => {
      const proxy = instanceKillBrokerProxy();
      const entry = RegistryEntryStub({ id: INSTANCE_ID, socketPath: SOCKET_PATH, state: 'dead' });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const heartbeatPath = AbsoluteFilePathStub({
        value: `${String(EVIDENCE_PATH)}/heartbeat.json`,
      });
      proxy.setupDriverUnreachableNoHeartbeat({
        socketPath: SOCKET_PATH,
        heartbeatPath,
        homePath: HOME_PATH,
      });

      const result = await instanceKillBroker({ instanceId: INSTANCE_ID });

      expect(result.stopped).toBe(true);
    });
  });
});
