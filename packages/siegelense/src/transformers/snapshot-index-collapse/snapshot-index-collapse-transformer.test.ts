import { snapshotIndexCollapseTransformer } from './snapshot-index-collapse-transformer';
import { SnapshotRecordStub } from '../../contracts/snapshot-record/snapshot-record.stub';

describe('snapshotIndexCollapseTransformer', () => {
  describe('the automatic pair across two runs', () => {
    it('VALID: {four automatic records} => returns all four, oldest first, every one manual: false', () => {
      const records = [
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
      ];

      const result = snapshotIndexCollapseTransformer({ records });

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
      ]);
    });
  });

  describe('a name captured twice', () => {
    it('VALID: {clean at 1000 and clean at 5000} => keeps the later capture only', () => {
      const records = [
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
      ];

      const result = snapshotIndexCollapseTransformer({ records });

      expect(result).toStrictEqual([
        {
          name: 'clean',
          atMs: 5000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        },
      ]);
    });
  });

  describe('ordering', () => {
    it('VALID: {records written out of time order} => returns them oldest-first by atMs', () => {
      const records = [
        SnapshotRecordStub({
          name: 'later',
          atMs: 9000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        }),
        SnapshotRecordStub({
          name: 'earlier',
          atMs: 100,
          manual: false,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        }),
      ];

      const result = snapshotIndexCollapseTransformer({ records });

      expect(result).toStrictEqual([
        {
          name: 'earlier',
          atMs: 100,
          manual: false,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        },
        {
          name: 'later',
          atMs: 9000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        },
      ]);
    });
  });

  describe('an empty index', () => {
    it('EMPTY: {records: []} => returns an empty list', () => {
      expect(snapshotIndexCollapseTransformer({ records: [] })).toStrictEqual([]);
    });
  });

  describe('purity', () => {
    it('VALID: {records} => leaves the caller array untouched', () => {
      const records = [
        SnapshotRecordStub({
          name: 'later',
          atMs: 9000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        }),
        SnapshotRecordStub({
          name: 'earlier',
          atMs: 100,
          manual: false,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
        }),
      ];

      snapshotIndexCollapseTransformer({ records });

      expect(records.map((record) => record.name)).toStrictEqual(['later', 'earlier']);
    });
  });
});
