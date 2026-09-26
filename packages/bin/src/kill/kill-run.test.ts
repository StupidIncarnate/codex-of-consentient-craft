import { killRun } from './kill-run';
import { killRunProxy } from './kill-run.proxy';
import { KillNotInstalledError } from './kill-not-installed-error';

describe('killRun()', () => {
  it('VALID: {exitCode: 0} => returns the result unchanged', async () => {
    const proxy = killRunProxy();
    proxy.setupResult({ args: ['-SIGKILL', '12345'], exitCode: 0, output: '' });

    const result = await killRun({ args: ['-SIGKILL', '12345'], cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
  });

  it('ERROR: {run throws RunNotFoundError} => throws KillNotInstalledError', async () => {
    const proxy = killRunProxy();
    proxy.setupNotFound({
      args: ['-SIGKILL', '12345'],
      message: 'spawn kill ENOENT',
    });

    await expect(killRun({ args: ['-SIGKILL', '12345'], cwd: '/repo' })).rejects.toStrictEqual(
      new KillNotInstalledError(
        'kill -SIGKILL 12345 could not start in /repo: "kill" never started: spawn kill ENOENT',
      ),
    );
  });

  it('EDGE: {exitCode: 1, output: "kill: (12345): No such process"} => returns it, does not throw', async () => {
    const proxy = killRunProxy();
    proxy.setupResult({
      args: ['-SIGKILL', '12345'],
      exitCode: 1,
      output: 'kill: (12345): No such process',
    });

    const result = await killRun({ args: ['-SIGKILL', '12345'], cwd: '/repo' });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: 'kill: (12345): No such process',
      signal: null,
      timedOut: false,
    });
  });
});
