import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { staleReapLayerBroker } from './stale-reap-layer-broker';
import { staleReapLayerBrokerProxy } from './stale-reap-layer-broker.proxy';

const INSTANCE_ID = InstanceIdStub({ value: 'inst_9b2c' });
const SOCKET_PATH = AbsoluteFilePathStub({ value: `/tmp/dm-siege-sockets/${INSTANCE_ID}.sock` });
const EVIDENCE_PATH = AbsoluteFilePathStub({
  value: `/home/user/.dungeonmaster/siegelense/unowned/instances/${INSTANCE_ID}`,
});
const HOME_PATH = AbsoluteFilePathStub({ value: `/tmp/dm-siege-${INSTANCE_ID}` });
const HEARTBEAT_PATH = AbsoluteFilePathStub({ value: `${String(EVIDENCE_PATH)}/heartbeat.json` });
const NOW_MS = EpochMsStub({ value: 1_700_000_000_000 });

describe('staleReapLayerBroker', () => {
  describe('a stale instance whose driver is already gone', () => {
    it('VALID: {a stale instance whose driver is already gone} => its recorded pgids are signalled anyway', async () => {
      const proxy = staleReapLayerBrokerProxy();
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        lastBeatMs: EpochMsStub({ value: NOW_MS - 9 * 60 * 60 * 1000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

      const pgidOne = ProcessGroupIdStub({ value: 33_812 });
      const pgidTwo = ProcessGroupIdStub({ value: 33_840 });
      const heartbeat = InstanceHeartbeatStub({
        instanceId: INSTANCE_ID,
        pgids: [pgidOne, pgidTwo],
      });
      proxy.setupDriverUnreachable({
        socketPath: SOCKET_PATH,
        heartbeatPath: HEARTBEAT_PATH,
        heartbeat,
        homePath: HOME_PATH,
      });

      const result = await staleReapLayerBroker({ entry, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reaped: { id: INSTANCE_ID, staleFor: '9h', killed: [pgidOne, pgidTwo], homeRemoved: true },
        portsReleased: [entry.ports.api, entry.ports.web],
      });
      expect(proxy.getKillGroupCallsFor({ pgid: pgidOne })).toStrictEqual(['SIGTERM', 0]);
      expect(proxy.getKillGroupCallsFor({ pgid: pgidTwo })).toStrictEqual(['SIGTERM', 0]);
    });
  });

  describe('a stale instance with no surviving heartbeat', () => {
    it('VALID: {no heartbeat file} => reaps with an empty killed list', async () => {
      const proxy = staleReapLayerBrokerProxy();
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        lastBeatMs: EpochMsStub({ value: NOW_MS - 60_000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableNoHeartbeat({
        socketPath: SOCKET_PATH,
        heartbeatPath: HEARTBEAT_PATH,
        homePath: HOME_PATH,
      });

      const result = await staleReapLayerBroker({ entry, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reaped: { id: INSTANCE_ID, staleFor: '1m', killed: [], homeRemoved: true },
        portsReleased: [entry.ports.api, entry.ports.web],
      });
    });
  });

  describe('a reservation that never beat', () => {
    it('EMPTY: {lastBeatMs: null} => reaps using reservedAtMs, not lastBeatMs, for staleFor', async () => {
      const proxy = staleReapLayerBrokerProxy();
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: null,
        pid: null,
        lastBeatMs: null,
        reservedAtMs: EpochMsStub({ value: NOW_MS - 9 * 60 * 60 * 1000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableNoHeartbeat({
        socketPath: SOCKET_PATH,
        heartbeatPath: HEARTBEAT_PATH,
        homePath: HOME_PATH,
      });

      const result = await staleReapLayerBroker({ entry, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reaped: { id: INSTANCE_ID, staleFor: '9h', killed: [], homeRemoved: true },
        portsReleased: [entry.ports.api, entry.ports.web],
      });
    });
  });
});
