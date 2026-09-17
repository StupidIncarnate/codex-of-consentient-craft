import { pruneAnswerContract } from './prune-answer-contract';
import { PruneAnswerStub } from './prune-answer.stub';

describe('pruneAnswerContract', () => {
  describe('valid answers', () => {
    it('VALID: {one removed, one refused, one kind unchecked} => parses the whole spec shape', () => {
      const answer = PruneAnswerStub();

      const result = pruneAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        freedMB: 4100,
        freedBytes: 4_299_161_600,
        removed: [
          {
            id: 'inst_9b2c',
            kind: null,
            freedBytes: 4_299_161_600,
            freedMB: 4100,
            tombstoned: true,
          },
        ],
        refused: [
          {
            id: 'inst_1d09',
            why: 'run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md',
          },
        ],
        unresolved: [{ kind: 'open-issue', why: 'no issue record exists on disk to check' }],
      });
    });

    it('EMPTY: {nothing matched} => an all-empty answer parses, and still carries the unchecked-kind list', () => {
      const answer = PruneAnswerStub({
        freedMB: 0 as never,
        freedBytes: 0 as never,
        removed: [],
        refused: [],
      });

      const result = pruneAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        freedMB: 0,
        freedBytes: 0,
        removed: [],
        refused: [],
        unresolved: [{ kind: 'open-issue', why: 'no issue record exists on disk to check' }],
      });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {unresolved omitted} => throws, so an answer can never be silent about a question it never put', () => {
      expect(() => {
        pruneAnswerContract.parse({
          freedMB: 0,
          freedBytes: 0,
          removed: [],
          refused: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {an extra key} => .strict() throws rather than accepting a field nothing renders', () => {
      expect(() => {
        pruneAnswerContract.parse({
          freedMB: 0,
          freedBytes: 0,
          removed: [],
          refused: [],
          unresolved: [],
          warned: [],
        });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
