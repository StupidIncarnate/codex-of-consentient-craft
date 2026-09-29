import { gitRunSync } from './git-run-sync';
import { GitNotInstalledError } from '../git-run/git-not-installed.error';
import { GitCommandFailedError } from './git-command-failed.error';

describe('gitRunSync()', () => {
  describe('real git', () => {
    it('VALID: {git --version} => returns the real version line', () => {
      const result = gitRunSync({ args: ['--version'], cwd: '/tmp' });

      expect(result).toMatch(/^git version \d+\.\d+\.\d+.*\n$/u);
    });

    it("ERROR: {git rev-parse outside any repo} => throws GitCommandFailedError with git's real stderr", () => {
      expect(() =>
        gitRunSync({
          args: ['rev-parse', '--git-dir'],
          cwd: '/',
          env: { PATH: '/usr/bin:/bin:/usr/local/bin', GIT_CEILING_DIRECTORIES: '/' },
        }),
      ).toThrow(
        new GitCommandFailedError({
          args: ['rev-parse', '--git-dir'],
          cwd: '/',
          status: 128,
          signal: null,
          stderr: 'fatal: not a git repository (or any of the parent directories): .git\n',
        }),
      );
    });

    it('ERROR: {PATH holds no git} => throws GitNotInstalledError', () => {
      expect(() => gitRunSync({ args: ['status'], cwd: '/tmp', env: { PATH: '' } })).toThrow(
        GitNotInstalledError,
      );
    });
  });
});
