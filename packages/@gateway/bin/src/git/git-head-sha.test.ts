import { headSha } from './git-head-sha';
import { headShaProxy } from './git-head-sha.proxy';

describe('headSha()', () => {
  it('VALID: {sha} => returns the trimmed sha', async () => {
    const proxy = headShaProxy();
    proxy.setupResult({ exitCode: 0, output: 'a1b2c3d4\n' });

    const result = await headSha({ cwd: '/repo' });

    expect(result).toBe('a1b2c3d4');
  });

  it('ERROR: {exitCode: 128} => returns null', async () => {
    const proxy = headShaProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: not a git repository' });

    const result = await headSha({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('EMPTY: {exitCode: 0, output: ""} => returns null', async () => {
    const proxy = headShaProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await headSha({ cwd: '/repo' });

    expect(result).toBe(null);
  });
});
