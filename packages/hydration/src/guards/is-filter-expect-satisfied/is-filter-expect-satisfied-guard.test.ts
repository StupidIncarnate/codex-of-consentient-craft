import { isFilterExpectSatisfiedGuard } from './is-filter-expect-satisfied-guard';

describe('isFilterExpectSatisfiedGuard', () => {
  describe('the smallest count that satisfies each expect value', () => {
    it('VALID: {expect: "one", count: 1} => returns true', () => {
      expect(isFilterExpectSatisfiedGuard({ expect: 'one', count: 1 })).toBe(true);
    });

    it('VALID: {expect: "some", count: 1} => returns true', () => {
      expect(isFilterExpectSatisfiedGuard({ expect: 'some', count: 1 })).toBe(true);
    });

    it('VALID: {expect: "any", count: 0} => returns true', () => {
      expect(isFilterExpectSatisfiedGuard({ expect: 'any', count: 0 })).toBe(true);
    });
  });

  describe('a count over the expected upper bound', () => {
    it('INVALID: {expect: "one", count: 2} => returns false', () => {
      expect(isFilterExpectSatisfiedGuard({ expect: 'one', count: 2 })).toBe(false);
    });
  });

  describe('a zero match under the default', () => {
    it('INVALID: {expect: "some", count: 0} => returns false', () => {
      expect(isFilterExpectSatisfiedGuard({ expect: 'some', count: 0 })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isFilterExpectSatisfiedGuard({})).toBe(false);
    });
  });
});
