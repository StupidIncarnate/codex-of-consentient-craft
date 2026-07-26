import { mockArgsMatchTransformer } from './mock-args-match-transformer';

describe('mockArgsMatchTransformer', () => {
  describe('prefix matching', () => {
    it('VALID: {staged one arg, call passes two} => matches on the prefix', () => {
      expect(
        mockArgsMatchTransformer({
          staged: ['/a/quest.json'],
          actual: ['/a/quest.json', 'utf-8'],
        }),
      ).toBe(1);
    });

    it('VALID: {staged exact arity} => scores every argument', () => {
      expect(
        mockArgsMatchTransformer({
          staged: ['/a/quest.json', 'utf-8'],
          actual: ['/a/quest.json', 'utf-8'],
        }),
      ).toBe(2);
    });

    it('INVALID: {staged more args than the call passes} => returns null', () => {
      expect(
        mockArgsMatchTransformer({ staged: ['/a/quest.json', 'utf-8'], actual: ['/a/quest.json'] }),
      ).toBe(null);
    });

    it('INVALID: {first arg differs} => returns null', () => {
      expect(
        mockArgsMatchTransformer({ staged: ['/a/quest.json'], actual: ['/a/manifest.json'] }),
      ).toBe(null);
    });
  });

  describe('specificity', () => {
    it('VALID: {options matcher on second arg} => scores higher than the pattern alone', () => {
      const patternOnly = mockArgsMatchTransformer({
        staged: ['src/**'],
        actual: ['src/**', { nodir: true, cwd: '/x' }],
      });
      const patternAndOptions = mockArgsMatchTransformer({
        staged: ['src/**', { nodir: true }],
        actual: ['src/**', { nodir: true, cwd: '/x' }],
      });

      expect(patternOnly).toBe(1);
      expect(patternAndOptions).toBe(2);
    });
  });

  describe('empty staging', () => {
    it('EMPTY: {staged: []} => matches any call with score zero', () => {
      expect(mockArgsMatchTransformer({ staged: [], actual: ['anything', 1] })).toBe(0);
    });

    it('EMPTY: {staged: [], actual: []} => matches a no-argument call', () => {
      expect(mockArgsMatchTransformer({ staged: [], actual: [] })).toBe(0);
    });
  });
});
