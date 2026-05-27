import { TsconfigReferenceStub } from '../../contracts/tsconfig-reference/tsconfig-reference.stub';
import { tsconfigReferencesEqualTransformer } from './tsconfig-references-equal-transformer';

describe('tsconfigReferencesEqualTransformer()', () => {
  describe('equal arrays', () => {
    it('VALID: {a: [], b: []} => returns true', () => {
      const result = tsconfigReferencesEqualTransformer({ a: [], b: [] });

      expect(result).toBe(true);
    });

    it('VALID: {a: [shared], b: [shared]} => returns true', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = tsconfigReferencesEqualTransformer({ a: [ref], b: [ref] });

      expect(result).toBe(true);
    });

    it('VALID: {a: [shared, hooks], b: [hooks, shared]} => returns true (order-insensitive)', () => {
      const shared = TsconfigReferenceStub({ path: '../shared' });
      const hooks = TsconfigReferenceStub({ path: '../hooks' });
      const result = tsconfigReferencesEqualTransformer({
        a: [shared, hooks],
        b: [hooks, shared],
      });

      expect(result).toBe(true);
    });
  });

  describe('unequal arrays', () => {
    it('INVALID: {a: [], b: [shared]} => returns false', () => {
      const ref = TsconfigReferenceStub({ path: '../shared' });
      const result = tsconfigReferencesEqualTransformer({ a: [], b: [ref] });

      expect(result).toBe(false);
    });

    it('INVALID: {a: [shared], b: [hooks]} => returns false', () => {
      const shared = TsconfigReferenceStub({ path: '../shared' });
      const hooks = TsconfigReferenceStub({ path: '../hooks' });
      const result = tsconfigReferencesEqualTransformer({ a: [shared], b: [hooks] });

      expect(result).toBe(false);
    });

    it('INVALID: {a: [shared, hooks], b: [shared]} => returns false', () => {
      const shared = TsconfigReferenceStub({ path: '../shared' });
      const hooks = TsconfigReferenceStub({ path: '../hooks' });
      const result = tsconfigReferencesEqualTransformer({ a: [shared, hooks], b: [shared] });

      expect(result).toBe(false);
    });
  });
});
