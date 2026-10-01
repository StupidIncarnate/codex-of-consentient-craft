import { GitNotInstalledError } from '../git-run/git-not-installed.error';
import { untrackedFiles } from './untracked-files';
import { untrackedFilesProxy } from './untracked-files.proxy';

describe('untrackedFiles()', () => {
  it('VALID: {one file, a warning on stderr} => returns the paths from stdout alone', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupResult({
      exitCode: 0,
      output: 'packages/a/new.ts\n',
      stderr: "warning: refname 'main' is ambiguous.\n",
    });

    const result = await untrackedFiles({ cwd: '/repo' });

    expect(result).toStrictEqual(['packages/a/new.ts']);
  });

  it('VALID: {output: two files} => returns file paths', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupResult({ exitCode: 0, output: 'packages/a/new.ts\npackages/b/new.ts\n' });

    const result = await untrackedFiles({ cwd: '/repo' });

    expect(result).toStrictEqual(['packages/a/new.ts', 'packages/b/new.ts']);
  });

  it('ERROR: {exitCode: 128} => throws naming the command and output', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: not a git repository' });

    await expect(untrackedFiles({ cwd: '/repo' })).rejects.toStrictEqual(
      new Error(
        'git ls-files --others --exclude-standard failed with exit code 128: fatal: not a git repository',
      ),
    );
  });

  it('EMPTY: {output: ""} => returns an empty array', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await untrackedFiles({ cwd: '/repo' });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {setupNotFound} => rejects with GitNotInstalledError naming the full command', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupNotFound();

    await expect(untrackedFiles({ cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git ls-files --others --exclude-standard could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = untrackedFilesProxy();
      proxy.setupResult({ exitCode: 0, output: '' });

      await untrackedFiles({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['ls-files', '--others', '--exclude-standard'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
