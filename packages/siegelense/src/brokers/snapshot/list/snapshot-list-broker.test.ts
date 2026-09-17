import { snapshotListBroker } from './snapshot-list-broker';
import { snapshotListBrokerProxy } from './snapshot-list-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });
const NOW_MS = 1735689600000;

describe('snapshotListBroker', () => {
  describe('an alive instance that has run twice', () => {
    it('VALID: {four automatic records} => returns run_1:start, run_1:end, run_2:start and run_2:end, every one manual: false', async () => {
      const proxy = snapshotListBrokerProxy();
      proxy.setupNow({ nowMs: NOW_MS });
      proxy.setupInstance({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          bootedAtMs: NOW_MS,
          lastBeatMs: NOW_MS,
        }),
      });
      proxy.setupIndex({
        instanceId: INSTANCE_ID,
        records: [
          SnapshotRecordStub({
            name: 'run_1:start',
            atMs: 1000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
          SnapshotRecordStub({
            name: 'run_1:end',
            atMs: 2000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          }),
          SnapshotRecordStub({
            name: 'run_2:start',
            atMs: 3000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/3',
          }),
          SnapshotRecordStub({
            name: 'run_2:end',
            atMs: 4000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/4',
          }),
        ],
      });

      const result = await snapshotListBroker({ instanceId: INSTANCE_ID });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        snapshots: [
          {
            name: 'run_1:start',
            atMs: 1000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          },
          {
            name: 'run_1:end',
            atMs: 2000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          },
          {
            name: 'run_2:start',
            atMs: 3000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/3',
          },
          {
            name: 'run_2:end',
            atMs: 4000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/4',
          },
        ],
      });
    });

    it('VALID: {a manual name beside the automatic pair} => both kinds come back, distinguished by manual', async () => {
      const proxy = snapshotListBrokerProxy();
      proxy.setupNow({ nowMs: NOW_MS });
      proxy.setupInstance({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          bootedAtMs: NOW_MS,
          lastBeatMs: NOW_MS,
        }),
      });
      proxy.setupIndex({
        instanceId: INSTANCE_ID,
        records: [
          SnapshotRecordStub({
            name: 'clean',
            atMs: 500,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
          SnapshotRecordStub({
            name: 'run_1:start',
            atMs: 1000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          }),
        ],
      });

      const result = await snapshotListBroker({ instanceId: INSTANCE_ID });

      expect(result.snapshots).toStrictEqual([
        {
          name: 'clean',
          atMs: 500,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        },
        {
          name: 'run_1:start',
          atMs: 1000,
          manual: false,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        },
      ]);
    });

    it('VALID: {a name captured twice} => the list shows one row, holding the later capture', async () => {
      const proxy = snapshotListBrokerProxy();
      proxy.setupNow({ nowMs: NOW_MS });
      proxy.setupInstance({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          bootedAtMs: NOW_MS,
          lastBeatMs: NOW_MS,
        }),
      });
      proxy.setupIndex({
        instanceId: INSTANCE_ID,
        records: [
          SnapshotRecordStub({
            name: 'clean',
            atMs: 500,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
          SnapshotRecordStub({
            name: 'clean',
            atMs: 6000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          }),
        ],
      });

      const result = await snapshotListBroker({ instanceId: INSTANCE_ID });

      expect(result.snapshots).toStrictEqual([
        {
          name: 'clean',
          atMs: 6000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        },
      ]);
    });

    it('EMPTY: {an alive instance with no captures yet} => empty list under instanceState alive', async () => {
      const proxy = snapshotListBrokerProxy();
      proxy.setupNow({ nowMs: NOW_MS });
      proxy.setupInstance({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          bootedAtMs: NOW_MS,
          lastBeatMs: NOW_MS,
        }),
      });
      proxy.setupNoStore({ instanceId: INSTANCE_ID });

      const result = await snapshotListBroker({ instanceId: INSTANCE_ID });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        snapshots: [],
      });
    });
  });

  describe('snapshots are gone with the instance', () => {
    it('EMPTY: {a killed instance} => empty list under instanceState killed, which is what tells it apart from an alive instance that captured nothing', async () => {
      const proxy = snapshotListBrokerProxy();
      proxy.setupNow({ nowMs: NOW_MS });
      proxy.setupInstance({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          bootedAtMs: NOW_MS,
          lastBeatMs: NOW_MS,
        }),
      });
      proxy.setupNoStore({ instanceId: INSTANCE_ID });

      const result = await snapshotListBroker({ instanceId: INSTANCE_ID });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'killed',
        snapshots: [],
      });
    });

    it('EMPTY: {a pruned instance} => empty list under instanceState pruned', async () => {
      const proxy = snapshotListBrokerProxy();
      proxy.setupNow({ nowMs: NOW_MS });
      proxy.setupInstance({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'pruned',
          bootedAtMs: NOW_MS,
          lastBeatMs: NOW_MS,
          prunedAtMs: NOW_MS,
          prunedByRule: 'olderThan 7d',
        }),
      });
      proxy.setupNoStore({ instanceId: INSTANCE_ID });

      const result = await snapshotListBroker({ instanceId: INSTANCE_ID });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'pruned',
        snapshots: [],
      });
    });
  });

  describe('an instance id nobody recognises', () => {
    it('EMPTY: {no registry row} => a REAL answer carrying instanceState unknown, never a throw', async () => {
      const proxy = snapshotListBrokerProxy();
      proxy.setupNow({ nowMs: NOW_MS });
      proxy.setupUnknownInstance();
      proxy.setupNoStore({ instanceId: INSTANCE_ID });

      const result = await snapshotListBroker({ instanceId: INSTANCE_ID });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'unknown',
        snapshots: [],
      });
    });
  });
});
