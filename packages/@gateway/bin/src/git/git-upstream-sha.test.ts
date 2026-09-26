import { upstreamSha } from './git-upstream-sha';
import { upstreamShaProxy } from './git-upstream-sha.proxy';

describe('upstreamSha()', () => {
  it('VALID: {sha} => returns the trimmed sha', async () => {
    const proxy = upstreamShaProxy();
    proxy.setupResult({ exitCode: 0, output: 'e5f6a7b8\n' });

    const result = await upstreamSha({ cwd: '/repo' });

    expect(result).toBe('e5f6a7b8');
  });

  it('EMPTY: {no upstream configured} => returns null', async () => {
    const proxy = upstreamShaProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: no upstream configured' });

    const result = await upstreamSha({ cwd: '/repo' });

    expect(result).toBe(null);
  });
});
