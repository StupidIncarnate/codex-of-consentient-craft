import { snapshotsArgsContract } from './snapshots-args-contract';
import { SnapshotsArgsStub } from './snapshots-args.stub';

describe('snapshotsArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId} => parses with json false by default', () => {
      expect(SnapshotsArgsStub({ instanceId: 'inst_9b2c4d1e' })).toStrictEqual({
        instanceId: 'inst_9b2c4d1e',
        json: false,
      });
    });

    it('VALID: {instanceId, json: true} => parses with json true', () => {
      expect(SnapshotsArgsStub({ instanceId: 'inst_9b2c4d1e', json: true })).toStrictEqual({
        instanceId: 'inst_9b2c4d1e',
        json: true,
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
