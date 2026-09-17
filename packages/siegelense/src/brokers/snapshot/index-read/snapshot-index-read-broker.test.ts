import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { snapshotIndexReadBroker } from './snapshot-index-read-broker';
import { snapshotIndexReadBrokerProxy } from './snapshot-index-read-broker.proxy';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';

const HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });

describe('snapshotIndexReadBroker', () => {
  describe('an index that does not exist', () => {
    it('EMPTY: {no index file} => returns an empty list rather than throwing', async () => {
      const proxy = snapshotIndexReadBrokerProxy();
      proxy.setupNoIndex({ homePath: HOME_PATH });

      const result = await snapshotIndexReadBroker({ homePath: HOME_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('an index holding records', () => {
    it('VALID: {two lines} => returns both records in capture order', async () => {
      const proxy = snapshotIndexReadBrokerProxy();
      proxy.setupIndex({
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
        ],
      });

      const result = await snapshotIndexReadBroker({ homePath: HOME_PATH });

      expect(result).toStrictEqual([
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
      ]);
    });

    it('VALID: {duplicate names} => returns BOTH, because this is the raw write log', async () => {
      const proxy = snapshotIndexReadBrokerProxy();
      proxy.setupIndex({
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

      const result = await snapshotIndexReadBroker({ homePath: HOME_PATH });

      expect(result).toStrictEqual([
        {
          name: 'clean',
          atMs: 1000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        },
        {
          name: 'clean',
          atMs: 5000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        },
      ]);
    });

    it('EDGE: {a trailing blank line} => is skipped rather than parsed as a record', async () => {
      const proxy = snapshotIndexReadBrokerProxy();
      proxy.setupRawIndex({
        homePath: HOME_PATH,
        contents:
          '{"name":"clean","atMs":1000,"manual":true,"path":"/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1"}\n\n',
      });

      const result = await snapshotIndexReadBroker({ homePath: HOME_PATH });

      expect(result).toStrictEqual([
        {
          name: 'clean',
          atMs: 1000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        },
      ]);
    });

    it('EMPTY: {an index file with no lines} => returns an empty list', async () => {
      const proxy = snapshotIndexReadBrokerProxy();
      proxy.setupRawIndex({ homePath: HOME_PATH, contents: '' });

      const result = await snapshotIndexReadBroker({ homePath: HOME_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('an index that exists but cannot be parsed', () => {
    it('ERROR: {a malformed line} => throws naming the index, never reading as empty', async () => {
      const proxy = snapshotIndexReadBrokerProxy();
      proxy.setupRawIndex({ homePath: HOME_PATH, contents: '{"name":"clean",\n' });

      await expect(snapshotIndexReadBroker({ homePath: HOME_PATH })).rejects.toThrow(
        /Snapshot index at \/tmp\/dm-siege-inst_7f3a9c21\/\.siegelense-snapshots\/index\.jsonl exists but could not be parsed/u,
      );
    });

    it('ERROR: {a line missing the manual field} => throws rather than dropping the row', async () => {
      const proxy = snapshotIndexReadBrokerProxy();
      proxy.setupRawIndex({
        homePath: HOME_PATH,
        contents:
          '{"name":"clean","atMs":1000,"path":"/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1"}\n',
      });

      await expect(snapshotIndexReadBroker({ homePath: HOME_PATH })).rejects.toThrow(
        /could not be parsed/u,
      );
    });
  });
});
