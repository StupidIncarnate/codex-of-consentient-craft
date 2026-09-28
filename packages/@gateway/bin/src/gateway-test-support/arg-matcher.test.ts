import { argsMatcher } from './arg-matcher';
import type { ArgMatcher, ArgsMatcher } from './arg-matcher';

describe('ArgMatcher', () => {
  it('VALID: {a literal string} => is usable as an ArgMatcher exact-match value', () => {
    const matcher = 'quest/foo' satisfies ArgMatcher;

    expect(matcher).toBe('quest/foo');
  });

  it('VALID: {a predicate function} => is usable as an ArgMatcher tolerant-match value, evaluated against the real argv element', () => {
    const matcher = ((value: unknown): boolean => value === 'quest/foo') satisfies ArgMatcher;

    expect(matcher('quest/foo')).toBe(true);
    expect(matcher('quest/bar')).toBe(false);
  });
});

describe('ArgsMatcher', () => {
  it('VALID: {an array of ArgMatcher} => is usable as an ArgsMatcher for a fixed-length argv', () => {
    const matcher = [
      'branch',
      '-D',
      (value: unknown): boolean => String(value).startsWith('quest/'),
    ] satisfies ArgsMatcher;

    expect(matcher.slice(0, 2)).toStrictEqual(['branch', '-D']);
  });

  it('VALID: {a predicate over the whole argv array} => is usable as an ArgsMatcher for a variable-shape call', () => {
    const matcher = ((args: readonly unknown[]): boolean =>
      args[2] === 'main') satisfies ArgsMatcher;

    expect(matcher(['rev-parse', '--verify', 'main'])).toBe(true);
  });
});

describe('argsMatcher', () => {
  describe('literal array matcher', () => {
    it('VALID: {matcher and actual are the same literal array} => returns true', () => {
      const result = argsMatcher({
        matcher: ['branch', '-D', 'quest/foo'],
        actual: ['branch', '-D', 'quest/foo'],
      });

      expect(result).toBe(true);
    });

    it('INVALID: {one element differs} => returns false', () => {
      const result = argsMatcher({
        matcher: ['branch', '-D', 'quest/foo'],
        actual: ['branch', '-D', 'quest/bar'],
      });

      expect(result).toBe(false);
    });

    it('EDGE: {actual has more elements than matcher} => returns false, not a prefix match', () => {
      const result = argsMatcher({
        matcher: ['branch', '-D'],
        actual: ['branch', '-D', 'quest/foo'],
      });

      expect(result).toBe(false);
    });

    it('EDGE: {actual has fewer elements than matcher} => returns false', () => {
      const result = argsMatcher({
        matcher: ['branch', '-D', 'quest/foo'],
        actual: ['branch', '-D'],
      });

      expect(result).toBe(false);
    });
  });

  describe('per-element predicate matcher', () => {
    it('VALID: {a predicate element accepts the real value} => returns true', () => {
      const result = argsMatcher({
        matcher: ['-SIGKILL', (value) => Number(value) > 0],
        actual: ['-SIGKILL', '54321'],
      });

      expect(result).toBe(true);
    });

    it('INVALID: {a predicate element rejects the real value} => returns false', () => {
      const result = argsMatcher({
        matcher: ['-SIGKILL', (value) => Number(value) > 0],
        actual: ['-SIGKILL', '-1'],
      });

      expect(result).toBe(false);
    });
  });

  describe('whole-array predicate matcher', () => {
    it('VALID: {predicate accepts the whole argv} => returns true', () => {
      const result = argsMatcher({
        matcher: (args) => args[2] === 'main',
        actual: ['rev-parse', '--verify', 'main'],
      });

      expect(result).toBe(true);
    });

    it('INVALID: {predicate rejects the whole argv} => returns false', () => {
      const result = argsMatcher({
        matcher: (args) => args[2] === 'main',
        actual: ['rev-parse', '--verify', 'master'],
      });

      expect(result).toBe(false);
    });
  });
});
