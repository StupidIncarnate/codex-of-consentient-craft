import { isArrayOfItemsWithIdGuard } from './is-array-of-items-with-id-guard';

describe('isArrayOfItemsWithIdGuard', () => {
  describe('valid arrays', () => {
    it('VALID: {value: [{id: "a"}]} => returns true', () => {
      const result = isArrayOfItemsWithIdGuard({ value: [{ id: 'a' }] });

      expect(result).toBe(true);
    });

    it('VALID: {value: [{id: "a", name: "x"}, {id: "b"}]} => returns true', () => {
      const result = isArrayOfItemsWithIdGuard({ value: [{ id: 'a', name: 'x' }, { id: 'b' }] });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "string"} => returns false', () => {
      const result = isArrayOfItemsWithIdGuard({ value: 'string' });

      expect(result).toBe(false);
    });

    it('INVALID: {value: [{name: "no-id"}]} => returns false', () => {
      const result = isArrayOfItemsWithIdGuard({ value: [{ name: 'no-id' }] });

      expect(result).toBe(false);
    });

    it('INVALID: {value: [1, 2, 3]} => returns false', () => {
      const result = isArrayOfItemsWithIdGuard({ value: [1, 2, 3] });

      expect(result).toBe(false);
    });

    it('INVALID: {value: [{id: "a"}, "not-object"]} => returns false', () => {
      const result = isArrayOfItemsWithIdGuard({ value: [{ id: 'a' }, 'not-object'] });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {value: []} => returns false', () => {
      const result = isArrayOfItemsWithIdGuard({ value: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {value: undefined} => returns false', () => {
      const result = isArrayOfItemsWithIdGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {value: null} => returns false', () => {
      const result = isArrayOfItemsWithIdGuard({ value: null });

      expect(result).toBe(false);
    });
  });
});
