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
