import type { PathMatcher } from './path-matcher';

describe('PathMatcher', () => {
  it('VALID: {a literal string} => is usable as a PathMatcher exact-match value', () => {
    const matcher = '/repo/packages/@gateway/node/src/fs/fs.ts' satisfies PathMatcher;

    expect(matcher).toBe('/repo/packages/@gateway/node/src/fs/fs.ts');
  });

  it('VALID: {a predicate function} => is usable as a PathMatcher tolerant-match value, evaluated against the real path', () => {
    const matcher = ((value: unknown): boolean =>
      String(value).endsWith('fs.ts')) satisfies PathMatcher;

    expect(matcher('/repo/packages/@gateway/node/src/fs/fs.ts')).toBe(true);
    expect(matcher('/repo/packages/@gateway/node/src/os/os.ts')).toBe(false);
  });
});
