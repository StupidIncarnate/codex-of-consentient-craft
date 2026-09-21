import { wardCheckTypeContract } from './ward-check-type-contract';
import { WardCheckTypeStub } from './ward-check-type.stub';

describe('wardCheckTypeContract', () => {
  describe('valid input', () => {
    it('VALID: {typecheck} => parses to the same string', () => {
      expect(String(wardCheckTypeContract.parse(WardCheckTypeStub()))).toBe('typecheck');
    });

    it('VALID: {a check type this repo does not run today} => parses, because the set is ward-owned', () => {
      expect(String(WardCheckTypeStub({ value: 'mutation' }))).toBe('mutation');
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {empty string} => throws', () => {
      expect(() => WardCheckTypeStub({ value: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
