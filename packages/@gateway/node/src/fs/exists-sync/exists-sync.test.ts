import { existsSync } from './exists-sync';
import { existsSyncProxy } from './exists-sync.proxy';

describe('existsSync', () => {
  it('VALID: {path: a path that resolves} => returns true', () => {
    const proxy = existsSyncProxy();
    proxy.returns({ path: '/tmp/present.json', exists: true });

    expect(existsSync('/tmp/present.json')).toBe(true);
  });

  it('VALID: {path: a missing path} => returns false', () => {
    const proxy = existsSyncProxy();
    proxy.returns({ path: '/tmp/missing.json', exists: false });

    expect(existsSync('/tmp/missing.json')).toBe(false);
  });

  it('EDGE: {path: a path Node reports unreadable, EACCES} => returns false, not a throw', () => {
    const proxy = existsSyncProxy();
    proxy.returns({ path: '/tmp/locked.json', exists: false });

    expect(existsSync('/tmp/locked.json')).toBe(false);
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns true for a path the predicate accepts', () => {
      const proxy = existsSyncProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('quest.json'),
        exists: true,
      });

      expect(existsSync('/resolved/at/runtime/quest.json')).toBe(true);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = existsSyncProxy();
      proxy.returns({ path: '/tmp/present.json', exists: true });

      existsSync('/tmp/present.json');

      expect(proxy.getCallsFor({ path: '/tmp/present.json' })).toStrictEqual([
        ['/tmp/present.json'],
      ]);
    });
  });
});
