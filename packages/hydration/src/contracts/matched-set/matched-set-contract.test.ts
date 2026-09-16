import { matchedSetContract } from './matched-set-contract';
import { MatchedSetStub } from './matched-set.stub';

describe('matchedSetContract', () => {
  describe('valid matched sets', () => {
    it('VALID: {ingredient: "operation", matchedRef: "operation[match]"} => returns both', () => {
      const result = MatchedSetStub({ ingredient: 'operation', matchedRef: 'operation[match]' });

      expect(result).toStrictEqual({ ingredient: 'operation', matchedRef: 'operation[match]' });
    });
  });

  describe('invalid matched sets', () => {
    it('INVALID: {no matchedRef} => throws Required', () => {
      expect(() => matchedSetContract.parse({ ingredient: 'operation' })).toThrow(/Required/u);
    });

    it('INVALID: {matchedRef: \'operation\'} => throws "must be an ancestor path"', () => {
      expect(() =>
        matchedSetContract.parse({ ingredient: 'operation', matchedRef: 'operation' }),
      ).toThrow(/must be an ancestor path like 'guild\[0:0\]\/quest\[0:2\]'/u);
    });
  });
});
