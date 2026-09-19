import { snapshotRecordContract } from './snapshot-record-contract';
import { SnapshotRecordStub } from './snapshot-record.stub';

describe('snapshotRecordContract', () => {
  describe('valid records', () => {
    it('VALID: {a manual record} => parses every field through', () => {
      const record = SnapshotRecordStub({
        name: 'clean',
        atMs: 1735689600000,
        manual: true,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
      });

      expect(record).toStrictEqual({
        name: 'clean',
        atMs: 1735689600000,
        manual: true,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
      });
    });

    it('VALID: {an automatic record} => parses the colon-namespaced name with manual false', () => {
      const record = SnapshotRecordStub({
        name: 'run_4:start',
        atMs: 1735689660000,
        manual: false,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
      });

      expect(record).toStrictEqual({
        name: 'run_4:start',
        atMs: 1735689660000,
        manual: false,
        path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
      });
    });
  });

  describe('invalid records', () => {
    it('INVALID: {a stray ordinal key} => throws, because the contract is strict', () => {
      expect(() =>
        snapshotRecordContract.parse({
          name: 'clean',
          atMs: 1735689600000,
          manual: true,
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          ordinal: 1,
        }),
      ).toThrow(/unrecognized_keys/u);
    });

    it('INVALID: {manual: "yes"} => throws, because manual is a boolean not a string', () => {
      expect(() =>
        snapshotRecordContract.parse({
          name: 'clean',
          atMs: 1735689600000,
          manual: 'yes',
          path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
        }),
      ).toThrow(/invalid_type/u);
    });

    it('INVALID: {path: "relative/dir"} => throws, because a payload path is absolute', () => {
      expect(() =>
        snapshotRecordContract.parse({
          name: 'clean',
          atMs: 1735689600000,
          manual: true,
          path: 'relative/dir',
        }),
      ).toThrow(/absolute/iu);
    });
  });
});
