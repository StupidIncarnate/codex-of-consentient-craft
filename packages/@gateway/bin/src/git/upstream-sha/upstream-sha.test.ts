import { upstreamSha } from './upstream-sha';
import { upstreamShaProxy } from './upstream-sha.proxy';

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

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = upstreamShaProxy();
      proxy.setupResult({ exitCode: 0, output: 'e5f6a7b8' });

      await upstreamSha({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '@{upstream}'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
