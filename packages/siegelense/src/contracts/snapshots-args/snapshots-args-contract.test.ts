import { snapshotsArgsContract } from './snapshots-args-contract';
import { SnapshotsArgsStub } from './snapshots-args.stub';

describe('snapshotsArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId} => parses the one field through', () => {
      expect(SnapshotsArgsStub({ instanceId: 'inst_9b2c4d1e' })).toStrictEqual({
        instanceId: 'inst_9b2c4d1e',
      });
    });
  });

  describe('invalid args', () => {
    it('EMPTY: {} => throws, because a snapshot belongs to one named instance', () => {
      expect(() => snapshotsArgsContract.parse({})).toThrow(/invalid_type/u);
    });

    it('INVALID: {a stray human key} => throws, because the contract is strict and there is no human renderer', () => {
      expect(() =>
        snapshotsArgsContract.parse({ instanceId: 'inst_7f3a9c21', human: true }),
      ).toThrow(/unrecognized_keys/u);
    });
  });
});
