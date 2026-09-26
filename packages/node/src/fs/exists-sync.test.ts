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
});
