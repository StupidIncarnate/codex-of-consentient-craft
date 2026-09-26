import { verifyRef } from './git-verify-ref';
import { verifyRefProxy } from './git-verify-ref.proxy';

describe('verifyRef()', () => {
  it('VALID: {ref: "main", exitCode: 0} => returns true', async () => {
    const proxy = verifyRefProxy();
    proxy.setupResult({ ref: 'main', exitCode: 0 });

    const result = await verifyRef({ cwd: '/repo', ref: 'main' });

    expect(result).toBe(true);
  });

  it('INVALID: {ref: "nope", exitCode: 128} => returns false', async () => {
    const proxy = verifyRefProxy();
    proxy.setupResult({ ref: 'nope', exitCode: 128 });

    const result = await verifyRef({ cwd: '/repo', ref: 'nope' });

    expect(result).toBe(false);
  });
});
