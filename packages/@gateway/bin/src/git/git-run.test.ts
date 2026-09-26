import { gitRun } from './git-run';
import { gitRunProxy } from './git-run.proxy';
import { GitNotInstalledError } from './git-not-installed-error';

describe('gitRun()', () => {
  it('VALID: {exitCode: 0, output: "main"} => returns the result unchanged', async () => {
    const proxy = gitRunProxy();
    proxy.setupResult({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], exitCode: 0, output: 'main' });

    const result = await gitRun({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: 'main', signal: null, timedOut: false });
  });

  it('ERROR: {run throws RunNotFoundError} => throws GitNotInstalledError', async () => {
    const proxy = gitRunProxy();
    proxy.setupNotFound({ args: ['status'], message: 'spawn git ENOENT' });

    await expect(gitRun({ args: ['status'], cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git status could not start in /repo: "git" never started: spawn git ENOENT',
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

  it('EDGE: {exitCode: 1, output: "", timedOut: true} => returns the result, does not throw', async () => {
    const proxy = gitRunProxy();
    proxy.setupResult({ args: ['status'], exitCode: 1, output: '', timedOut: true });

    const result = await gitRun({ args: ['status'], cwd: '/repo' });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: '',
      signal: null,
      timedOut: true,
    });
  });
});
