import { isInReadonlyArray } from './is-in-readonly-array';

describe('isInReadonlyArray', () => {
  const testArray = ['apple', 'banana', 'orange'] as const;

  describe('successful operations', () => {
    it('VALID: {value: "apple", array: ["apple", "banana", "orange"]} => returns true', () => {
      const result = isInReadonlyArray({ value: 'apple', array: testArray });

      expect(result).toBe(true);
    });

    it('VALID: {value: "banana", array: ["apple", "banana", "orange"]} => returns true', () => {
      const result = isInReadonlyArray({ value: 'banana', array: testArray });

      expect(result).toBe(true);
    });

    it('VALID: {value: "orange", array: ["apple", "banana", "orange"]} => returns true', () => {
      const result = isInReadonlyArray({ value: 'orange', array: testArray });

      expect(result).toBe(true);
    });
  });

  describe('failed operations', () => {
    it('INVALID: {value: "grape", array: ["apple", "banana", "orange"]} => returns false', () => {
      const result = isInReadonlyArray({ value: 'grape', array: testArray });

      expect(result).toBe(false);
    });

    it('INVALID: {value: "APPLE", array: ["apple", "banana", "orange"]} => returns false (case sensitive)', () => {
      const result = isInReadonlyArray({ value: 'APPLE', array: testArray });

      expect(result).toBe(false);
    });

    it('INVALID: {value: "", array: ["apple", "banana", "orange"]} => returns false', () => {
      const result = isInReadonlyArray({ value: '', array: testArray });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: 123, array: ["apple", "banana", "orange"]} => returns false (non-string)', () => {
      const result = isInReadonlyArray({ value: 123, array: testArray });

      expect(result).toBe(false);
    });

    it('EDGE: {value: null, array: ["apple", "banana", "orange"]} => returns false', () => {
      const result = isInReadonlyArray({ value: null, array: testArray });

      expect(result).toBe(false);
    });

    it('EDGE: {value: undefined, array: ["apple", "banana", "orange"]} => returns false', () => {
      const result = isInReadonlyArray({ value: undefined, array: testArray });

      expect(result).toBe(false);
    });

    it('EDGE: {value: "apple", array: []} => returns false (empty array)', () => {
      const emptyArray: readonly string[] = [];
      const result = isInReadonlyArray({ value: 'apple', array: emptyArray });

      expect(result).toBe(false);
    });

    it('EDGE: {value: {}, array: ["apple", "banana", "orange"]} => returns false (object)', () => {
      const result = isInReadonlyArray({ value: {}, array: testArray });

      expect(result).toBe(false);
    });

    it('EDGE: {value: ["apple"], array: ["apple", "banana", "orange"]} => returns false (array)', () => {
      const result = isInReadonlyArray({ value: ['apple'], array: testArray });

      expect(result).toBe(false);
    });
  });
});
