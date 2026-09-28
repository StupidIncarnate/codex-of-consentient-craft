import { gitRun } from './git-run';
import { gitRunProxy } from './git-run.proxy';
import { GitNotInstalledError } from './git-not-installed.error';

describe('gitRun()', () => {
  it('VALID: {exitCode: 0, output: "main"} => returns the result unchanged', async () => {
    const proxy = gitRunProxy();
    proxy.setupResult({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], exitCode: 0, output: 'main' });

    const result = await gitRun({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: 'main', signal: null, timedOut: false });
  });

  it('ERROR: {run throws RunNotFoundError} => throws GitNotInstalledError', async () => {
    const proxy = gitRunProxy();
    proxy.setupNotFound({ args: ['status'] });

    await expect(gitRun({ args: ['status'], cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git status could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  it('EDGE: {exitCode: 1, output: "fatal: not a git repository"} => returns the result, does not throw', async () => {
    const proxy = gitRunProxy();
    proxy.setupResult({
      args: ['status'],
      exitCode: 1,
      output: 'fatal: not a git repository',
    });

    const result = await gitRun({ args: ['status'], cwd: '/repo' });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: 'fatal: not a git repository',
      signal: null,
      timedOut: false,
    });
  });

  it('EDGE: {exitCode: 1, output: "", signal: SIGKILL} => returns the result, does not throw', async () => {
    const proxy = gitRunProxy();
    proxy.setupResult({ args: ['status'], exitCode: 1, output: '', signal: 'SIGKILL' });

    const result = await gitRun({ args: ['status'], cwd: '/repo' });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: '',
      signal: 'SIGKILL',
      timedOut: false,
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingArgs, a predicate} => resolves for args the predicate accepts', async () => {
      const proxy = gitRunProxy();
      proxy.returnsMatchingArgs({
        args: [(value) => value === 'commit', '-m', (value) => String(value).startsWith('quest:')],
        exitCode: 0,
        output: '',
      });

      const result = await gitRun({
        args: ['commit', '-m', 'quest: work items 3'],
        cwd: '/worktrees/computed-at-runtime',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
    });

    it('ERROR: {throwsMatchingArgs, a predicate} => rejects with GitNotInstalledError', async () => {
      const proxy = gitRunProxy();
      proxy.throwsMatchingArgs({
        args: [(value) => value === 'push'],
      });

      await expect(gitRun({ args: ['push'], cwd: '/repo' })).rejects.toStrictEqual(
        new GitNotInstalledError(
          'git push could not start in /repo: "git" never started: ENOENT: open \'git\'',
        ),
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = gitRunProxy();
      proxy.setupResult({ args: ['rev-parse', 'HEAD'], exitCode: 0, output: 'abc123' });

      await gitRun({ args: ['rev-parse', 'HEAD'], cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor({ args: ['rev-parse', 'HEAD'] })).toStrictEqual([
        [{ command: 'git', args: ['rev-parse', 'HEAD'], cwd: '/worktrees/computed-at-runtime' }],
      ]);
    });
  });
});
