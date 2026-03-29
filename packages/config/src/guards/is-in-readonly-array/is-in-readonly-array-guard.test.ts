import { isInReadonlyArrayGuard } from './is-in-readonly-array-guard';

describe('isInReadonlyArrayGuard', () => {
  const testArray = ['react', 'vue', 'angular'] as const;

  describe('valid cases', () => {
    it('VALID: {value: "react", array: testArray} => returns true', () => {
      const result = isInReadonlyArrayGuard({ value: 'react', array: testArray });

      expect(result).toBe(true);
    });

    it('VALID: {value: "vue", array: testArray} => returns true', () => {
      const result = isInReadonlyArrayGuard({ value: 'vue', array: testArray });

      expect(result).toBe(true);
    });

    it('VALID: {value: "angular", array: testArray} => returns true', () => {
      const result = isInReadonlyArrayGuard({ value: 'angular', array: testArray });

      expect(result).toBe(true);
    });
  });

  describe('invalid cases', () => {
    it('INVALID: {value: "svelte", array: testArray} => returns false', () => {
      const result = isInReadonlyArrayGuard({ value: 'svelte', array: testArray });

      expect(result).toBe(false);
    });

    it('INVALID: {value: 123, array: testArray} => returns false', () => {
      const result = isInReadonlyArrayGuard({ value: 123, array: testArray });

      expect(result).toBe(false);
    });

    it('INVALID: {value: undefined, array: testArray} => returns false', () => {
      const result = isInReadonlyArrayGuard({ array: testArray });

      expect(result).toBe(false);
    });

    it('INVALID: {value: null, array: testArray} => returns false', () => {
      const result = isInReadonlyArrayGuard({ value: null, array: testArray });

      expect(result).toBe(false);
    });

    it('INVALID: {value: "react", array: undefined} => returns false', () => {
      const result = isInReadonlyArrayGuard({ value: 'react' });

      expect(result).toBe(false);
    });

    it('INVALID: {value: "react", array: []} => returns false', () => {
      const result = isInReadonlyArrayGuard({ value: 'react', array: [] });

      expect(result).toBe(false);
    });

    it('INVALID: {value: undefined, array: undefined} => returns false', () => {
      const result = isInReadonlyArrayGuard({});

      expect(result).toBe(false);
    });
  });
});
