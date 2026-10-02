import { GitNotInstalledError } from '../git-run/git-not-installed.error';
import { commonDir } from './common-dir';
import { commonDirProxy } from './common-dir.proxy';

describe('commonDir()', () => {
  it('VALID: {relative output} => returns absolute path resolved against cwd', async () => {
    const proxy = commonDirProxy();
    proxy.setupResult({ exitCode: 0, output: '.git\n' });

    const result = await commonDir({ cwd: '/repo' });

    expect(result).toBe('/repo/.git');
  });

  it('VALID: {absolute output} => returns absolute path kept', async () => {
    const proxy = commonDirProxy();
    proxy.setupResult({ exitCode: 0, output: '/repo/.git\n' });

    const result = await commonDir({ cwd: '/repo/worktrees/wt-1' });

    expect(result).toBe('/repo/.git');
  });

  it('EDGE: {exitCode: 128} => returns null', async () => {
    const proxy = commonDirProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: not a git repository\n' });

    const result = await commonDir({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('EMPTY: {exitCode: 0, output: ""} => returns null', async () => {
    const proxy = commonDirProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await commonDir({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('ERROR: {git not installed} => throws GitNotInstalledError', async () => {
    const proxy = commonDirProxy();
    proxy.setupNotFound();

    await expect(commonDir({ cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git rev-parse --git-common-dir could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = commonDirProxy();
      proxy.setupResult({ exitCode: 0, output: '.git' });

      await commonDir({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '--git-common-dir'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
