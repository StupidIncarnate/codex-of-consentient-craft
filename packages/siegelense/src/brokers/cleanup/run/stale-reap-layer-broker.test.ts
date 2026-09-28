import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
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
const NOW_MS = EpochMsStub({ value: 1_700_000_000_000 });

describe('staleReapLayerBroker', () => {
  describe('a stale instance whose driver is already gone', () => {
    it('VALID: {a stale instance whose driver is already gone} => its recorded pgids are signalled anyway', async () => {
      const proxy = staleReapLayerBrokerProxy();
      const pgidOne = ProcessGroupIdStub({ value: 33_812 });
      const pgidTwo = ProcessGroupIdStub({ value: 33_840 });
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
        lastBeatMs: EpochMsStub({ value: NOW_MS - 9 * 60 * 60 * 1000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableReapsLivePgids({
        socketPath: SOCKET_PATH,
        pgids: [pgidOne, pgidTwo],
        homePath: HOME_PATH,
      });
      proxy.setupShutdownReasonWriteSucceeds({ evidencePath: EVIDENCE_PATH });

      const result = await staleReapLayerBroker({ entry, nowMs: NOW_MS });

      expect(result).toStrictEqual({
        reaped: { id: INSTANCE_ID, staleFor: '9h', killed: [pgidOne, pgidTwo], homeRemoved: true },
        portsReleased: [entry.ports.api, entry.ports.web],
      });
      // Probed alive before EITHER signal (0), SIGTERM, probed alive again before SIGKILL (0),
      // SIGKILL — the escalation `instanceKillBroker`'s orphan-reap path runs against a genuinely
      // live group it found through the registry row, never a separate heartbeat file.
      expect(proxy.getKillGroupCallsFor({ pgid: pgidOne })).toStrictEqual([
        0,
        'SIGTERM',
        0,
        'SIGKILL',
      ]);
      expect(proxy.getKillGroupCallsFor({ pgid: pgidTwo })).toStrictEqual([
        0,
        'SIGTERM',
        0,
        'SIGKILL',
      ]);
      // status's likelyCause reads this file verbatim when it exists — naming the CAUSE (cleanup's
      // own staleness detection) rather than the instance-kill-broker's generic orphan-reap wording,
      // so a reader of `status` sees what actually ended the instance.
      expect(proxy.getWrittenShutdownReason({ evidencePath: EVIDENCE_PATH })).toStrictEqual({
        reason: 'reaped by cleanup after its heartbeat went stale',
        atMs: EpochMsStub().valueOf(),
      });
    });
  });

  describe('a stale instance with no pgids left to reap', () => {
    it('VALID: {no pgids recorded} => reaps with an empty killed list', async () => {
      const proxy = staleReapLayerBrokerProxy();
      const entry = RegistryEntryStub({
        id: INSTANCE_ID,
        socketPath: SOCKET_PATH,
        pgids: [],
        lastBeatMs: EpochMsStub({ value: NOW_MS - 60_000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableNoPgids({
        socketPath: SOCKET_PATH,
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
        pgids: [],
        lastBeatMs: null,
        reservedAtMs: EpochMsStub({ value: NOW_MS - 9 * 60 * 60 * 1000 }),
      });
      proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
      proxy.setupDriverUnreachableNoPgids({
        socketPath: SOCKET_PATH,
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
