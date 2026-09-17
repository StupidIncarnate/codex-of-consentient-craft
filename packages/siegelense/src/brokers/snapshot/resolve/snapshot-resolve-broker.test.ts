import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { snapshotResolveBroker } from './snapshot-resolve-broker';
import { snapshotResolveBrokerProxy } from './snapshot-resolve-broker.proxy';
import { SnapshotNameStub } from '../../../contracts/snapshot-name/snapshot-name.stub';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

const HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });

describe('snapshotResolveBroker', () => {
  describe('a name that exists', () => {
    it('VALID: {name: clean} => returns the record holding that name and its payload path', async () => {
      const proxy = snapshotResolveBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
        records: [
          SnapshotRecordStub({
            name: 'clean',
            atMs: 1000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
          SnapshotRecordStub({
            name: 'run_1:start',
            atMs: 2000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          }),
        ],
      });

      const result = await snapshotResolveBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'clean' }),
      });

      expect(result).toStrictEqual({
        name: 'clean',
        atMs: 1000,
        manual: true,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
      });
    });

    it('VALID: {name captured twice} => returns the LATER capture, matching what the list shows', async () => {
      const proxy = snapshotResolveBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
        records: [
          SnapshotRecordStub({
            name: 'clean',
            atMs: 1000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
          SnapshotRecordStub({
            name: 'clean',
            atMs: 5000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          }),
        ],
      });

      const result = await snapshotResolveBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'clean' }),
      });

      expect(result).toStrictEqual({
        name: 'clean',
        atMs: 5000,
        manual: true,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
      });
    });

    it('VALID: {name: run_2:end} => resolves an automatic name exactly like a typed one', async () => {
      const proxy = snapshotResolveBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
        records: [
          SnapshotRecordStub({
            name: 'run_2:end',
            atMs: 4000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/4',
          }),
        ],
      });

      const result = await snapshotResolveBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'run_2:end' }),
      });

      expect(result).toStrictEqual({
        name: 'run_2:end',
        atMs: 4000,
        manual: false,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/4',
      });
    });
  });

  describe('a name that does not exist — never resolved to the nearest', () => {
    it('ERROR: {name: "clean2" against a store holding "clean"} => throws naming "clean2"', async () => {
      const proxy = snapshotResolveBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
        records: [
          SnapshotRecordStub({
            name: 'clean',
            atMs: 1000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
        ],
      });

      await expect(
        snapshotResolveBroker({
          homePath: HOME_PATH,
          name: SnapshotNameStub({ value: 'clean2' }),
        }),
      ).rejects.toThrow(
        /No snapshot named "clean2" on this instance — it is never resolved to the nearest one\. Snapshots that exist: clean\./u,
      );
    });

    it('ERROR: {name: "clean2" against a store holding exactly one snapshot} => the outcome is the error, never that one snapshot', async () => {
      const proxy = snapshotResolveBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
        records: [
          SnapshotRecordStub({
            name: 'clean',
            atMs: 1000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          }),
        ],
      });

      // Resolving would make `outcome` the record itself, so this assertion fails loudly if a single
      // candidate is ever treated as an obvious answer.
      const outcome: unknown = await snapshotResolveBroker({
        homePath: HOME_PATH,
        name: SnapshotNameStub({ value: 'clean2' }),
      }).catch((error: unknown) => String(error));

      expect(outcome).toBe(
        'SnapshotMissingError: No snapshot named "clean2" on this instance — it is never resolved to the nearest one. Snapshots that exist: clean.',
      );
    });

    it('ERROR: {name: "run_1:strt" against the four automatic names} => throws listing all four', async () => {
      const proxy = snapshotResolveBrokerProxy();
      proxy.setupStoreHolding({
        homePath: HOME_PATH,
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

      await expect(
        snapshotResolveBroker({
          homePath: HOME_PATH,
          name: SnapshotNameStub({ value: 'run_1:strt' }),
        }),
      ).rejects.toThrow(/Snapshots that exist: run_1:start, run_1:end, run_2:start, run_2:end\./u);
    });
  });

  describe('an instance with no store at all', () => {
    it('EMPTY: {no index file} => throws saying the instance holds no snapshots', async () => {
      const proxy = snapshotResolveBrokerProxy();
      proxy.setupNoStore({ homePath: HOME_PATH });

      await expect(
        snapshotResolveBroker({
          homePath: HOME_PATH,
          name: SnapshotNameStub({ value: 'clean' }),
        }),
      ).rejects.toThrow(/This instance holds no snapshots at all\./u);
    });
  });
});
