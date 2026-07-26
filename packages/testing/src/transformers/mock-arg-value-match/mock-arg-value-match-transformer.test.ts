import { mockArgValueMatchTransformer } from './mock-arg-value-match-transformer';

describe('mockArgValueMatchTransformer', () => {
  describe('primitives', () => {
    it('VALID: {staged: path, actual: same path} => scores one leaf', () => {
      expect(
        mockArgValueMatchTransformer({ staged: '/a/quest.json', actual: '/a/quest.json' }),
      ).toBe(1);
    });

    it('INVALID: {staged: path, actual: other path} => returns null', () => {
      expect(
        mockArgValueMatchTransformer({ staged: '/a/quest.json', actual: '/a/manifest.json' }),
      ).toBe(null);
    });

    it('VALID: {staged: NaN, actual: NaN} => matches', () => {
      expect(mockArgValueMatchTransformer({ staged: NaN, actual: NaN })).toBe(1);
    });
  });

  describe('objects match by subset', () => {
    it('VALID: {staged names one key, actual has extras} => matches on the named key', () => {
      expect(
        mockArgValueMatchTransformer({
          staged: { nodir: true },
          actual: { nodir: true, cwd: '/x', ignore: ['**/dist/**'] },
        }),
      ).toBe(1);
    });

    it('VALID: {staged names two keys} => scores each named key', () => {
      expect(
        mockArgValueMatchTransformer({
          staged: { nodir: true, cwd: '/x' },
          actual: { nodir: true, cwd: '/x', ignore: [] },
        }),
      ).toBe(2);
    });

    it('INVALID: {staged key differs} => returns null', () => {
      expect(
        mockArgValueMatchTransformer({ staged: { nodir: true }, actual: { nodir: false } }),
      ).toBe(null);
    });

    it('INVALID: {staged key absent from actual} => returns null', () => {
      expect(mockArgValueMatchTransformer({ staged: { nodir: true }, actual: { cwd: '/x' } })).toBe(
        null,
      );
    });

    it('VALID: {nested object} => scores nested leaves', () => {
      expect(
        mockArgValueMatchTransformer({
          staged: { env: { HOME: '/h' } },
          actual: { env: { HOME: '/h', PATH: '/bin' }, cwd: '/x' },
        }),
      ).toBe(1);
    });
  });

  describe('arrays match element-wise', () => {
    it('VALID: {same elements, same length} => scores each element', () => {
      expect(mockArgValueMatchTransformer({ staged: ['a', 'b'], actual: ['a', 'b'] })).toBe(2);
    });

    it('INVALID: {different length} => returns null', () => {
      expect(mockArgValueMatchTransformer({ staged: ['a'], actual: ['a', 'b'] })).toBe(null);
    });

    it('INVALID: {actual is not an array} => returns null', () => {
      expect(mockArgValueMatchTransformer({ staged: ['a'], actual: 'a' })).toBe(null);
    });
  });

  describe('predicate matcher', () => {
    it('VALID: {predicate returns true} => scores one leaf', () => {
      expect(
        mockArgValueMatchTransformer({
          staged: (value: unknown): boolean => String(value).startsWith('/tmp/'),
          actual: '/tmp/dm-e2e-123/quest.json',
        }),
      ).toBe(1);
    });

    it('INVALID: {predicate returns false} => returns null', () => {
      expect(
        mockArgValueMatchTransformer({
          staged: (value: unknown): boolean => String(value).startsWith('/tmp/'),
          actual: '/home/quest.json',
        }),
      ).toBe(null);
    });
  });

  describe('regex and date matchers', () => {
    it('VALID: {regex matches string} => scores one leaf', () => {
      expect(
        mockArgValueMatchTransformer({ staged: /quest\.json$/u, actual: '/a/quest.json' }),
      ).toBe(1);
    });

    it('INVALID: {regex against non-string} => returns null', () => {
      expect(mockArgValueMatchTransformer({ staged: /quest/u, actual: 42 })).toBe(null);
    });

    it('VALID: {equal dates} => scores one leaf', () => {
      expect(
        mockArgValueMatchTransformer({
          staged: new Date(0),
          actual: new Date(0),
        }),
      ).toBe(1);
    });
  });

  describe('null handling', () => {
    it('EMPTY: {staged: null, actual: null} => matches', () => {
      expect(mockArgValueMatchTransformer({ staged: null, actual: null })).toBe(1);
    });

    it('EMPTY: {staged object, actual null} => returns null', () => {
      expect(mockArgValueMatchTransformer({ staged: { a: 1 }, actual: null })).toBe(null);
    });

    it('EMPTY: {staged: undefined, actual: undefined} => matches', () => {
      expect(mockArgValueMatchTransformer({ staged: undefined, actual: undefined })).toBe(1);
    });
  });
});
