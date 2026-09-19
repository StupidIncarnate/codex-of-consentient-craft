import { pruneRefusalContract } from './prune-refusal-contract';
import { PruneRefusalStub } from './prune-refusal.stub';

describe('pruneRefusalContract', () => {
  describe('valid refusals', () => {
    it('VALID: {a cited instance} => parses with the run id and the citing path in the sentence', () => {
      const refusal = PruneRefusalStub();

      const result = pruneRefusalContract.parse(refusal);

      expect(result).toStrictEqual({
        id: 'inst_1d09',
        why: 'run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md',
      });
    });

    it('VALID: {a live instance} => the same shape carries a non-citation reason', () => {
      const refusal = PruneRefusalStub({ why: 'live — last beat 2s ago' as never });

      const result = pruneRefusalContract.parse(refusal);

      expect(result).toStrictEqual({ id: 'inst_1d09', why: 'live — last beat 2s ago' });
    });
  });

  describe('invalid refusals', () => {
    it('INVALID: {id: "1d09"} => a malformed instance id throws naming the shape it needed', () => {
      expect(() => {
        PruneRefusalStub({ id: '1d09' as never });
      }).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {why omitted} => throws, so a refusal can never be silent about its reason', () => {
      expect(() => {
        pruneRefusalContract.parse({ id: 'inst_1d09' });
      }).toThrow(/Required/u);
    });
  });
});
