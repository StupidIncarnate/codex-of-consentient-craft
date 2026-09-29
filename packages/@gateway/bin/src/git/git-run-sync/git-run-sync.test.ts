import { gitRunSync } from './git-run-sync';
import { gitRunSyncProxy } from './git-run-sync.proxy';
import { GitCommandFailedError } from './git-command-failed.error';

describe('gitRunSync()', () => {
  describe('successful exit', () => {
    it('VALID: {git exits 0 with stdout} => returns stdout unchanged', () => {
      const proxy = gitRunSyncProxy();
      proxy.setupResult({ args: ['remote'], cwd: '/repo', stdout: 'origin\n' });

      const result = gitRunSync({ args: ['remote'], cwd: '/repo' });

      expect(result).toBe('origin\n');
    });

    it('VALID: {two calls differing only by cwd} => each reads its own staged stdout', () => {
      const proxy = gitRunSyncProxy();
      proxy.setupResult({ args: ['remote'], cwd: '/repo-a', stdout: 'origin\n' });
      proxy.setupResult({ args: ['remote'], cwd: '/repo-b', stdout: '' });

      const results = [
        gitRunSync({ args: ['remote'], cwd: '/repo-a' }),
        gitRunSync({ args: ['remote'], cwd: '/repo-b' }),
      ];

      expect(results).toStrictEqual(['origin\n', '']);
    });
  });

  describe('environment', () => {
    it('VALID: {env given} => spawns git with exactly that env', () => {
      const proxy = gitRunSyncProxy();
      proxy.setupResult({ args: ['commit', '-m', 'base'], cwd: '/repo', stdout: '' });

      gitRunSync({
        args: ['commit', '-m', 'base'],
        cwd: '/repo',
        env: { GIT_AUTHOR_NAME: 'Fixture', PATH: '/usr/bin' },
      });

      expect(proxy.getEnvFor({ args: ['commit', '-m', 'base'], cwd: '/repo' })).toStrictEqual({
        GIT_AUTHOR_NAME: 'Fixture',
        PATH: '/usr/bin',
      });
    });

    it('EMPTY: {env omitted} => spawns git with no env option, inheriting the parent env', () => {
      const proxy = gitRunSyncProxy();
      proxy.setupResult({ args: ['status'], cwd: '/repo', stdout: '' });

      gitRunSync({ args: ['status'], cwd: '/repo' });

      expect(proxy.getEnvFor({ args: ['status'], cwd: '/repo' })).toBe(undefined);
    });
  });

  describe('unsuccessful exit', () => {
    it('ERROR: {git exits 128} => throws GitCommandFailedError carrying status and stderr', () => {
      const proxy = gitRunSyncProxy();
      proxy.setupFailure({
        args: ['remote'],
        cwd: '/repo',
        status: 128,
        stderr: 'fatal: not a git repository',
      });

      expect(() => gitRunSync({ args: ['remote'], cwd: '/repo' })).toThrow(
        new GitCommandFailedError({
          args: ['remote'],
          cwd: '/repo',
          status: 128,
          signal: null,
          stderr: 'fatal: not a git repository',
        }),
      );
    });

    it('ERROR: {git killed by SIGKILL} => throws GitCommandFailedError naming the signal', () => {
      const proxy = gitRunSyncProxy();
      proxy.setupFailure({
        args: ['gc'],
        cwd: '/repo',
        status: null,
        stderr: '',
        signal: 'SIGKILL',
      });

      expect(() => gitRunSync({ args: ['gc'], cwd: '/repo' })).toThrow(
        /^git gc failed in \/repo \(status null, signal SIGKILL\): $/u,
      );
    });
  });
});
