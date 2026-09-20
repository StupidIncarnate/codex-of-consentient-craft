import { snapshotsAnswerContract } from './snapshots-answer-contract';
import { SnapshotsAnswerStub } from './snapshots-answer.stub';

describe('snapshotsAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {one manual and one automatic row} => parses both rows through in order', () => {
      const answer = SnapshotsAnswerStub({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        snapshots: [
          {
            name: 'clean',
            atMs: 1735689600000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          },
          {
            name: 'run_4:start',
            atMs: 1735689660000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          },
        ],
      });

      expect(answer).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'alive',
        snapshots: [
          {
            name: 'clean',
            atMs: 1735689600000,
            manual: true,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/1',
          },
          {
            name: 'run_4:start',
            atMs: 1735689660000,
            manual: false,
            path: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/2',
          },
        ],
      });
    });

    it('EMPTY: {instanceState: "killed", snapshots: []} => parses, and the state is what distinguishes it from an alive instance that has captured nothing', () => {
      const answer = SnapshotsAnswerStub({ instanceState: 'killed', snapshots: [] });

      expect(answer).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'killed',
        snapshots: [],
      });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {instanceState: "sleeping"} => throws, because the lifecycle enum is closed', () => {
      expect(() =>
        snapshotsAnswerContract.parse({
          instanceId: 'inst_7f3a9c21',
          instanceState: 'sleeping',
          snapshots: [],
        }),
      ).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {a stray homePath key} => throws, because the contract is strict', () => {
      expect(() =>
        snapshotsAnswerContract.parse({
          instanceId: 'inst_7f3a9c21',
          instanceState: 'alive',
          snapshots: [],
          homePath: '/tmp/dm-siege-inst_7f3a9c21',
        }),
      ).toThrow(/unrecognized_keys/u);
    });
  });
});
