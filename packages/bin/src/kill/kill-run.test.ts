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

  it('ERROR: {exitCode: 1, output: "", signal: null, timedOut: false} => throws KillNotInstalledError', async () => {
    const proxy = killRunProxy();
    proxy.setupResult({ args: ['-SIGKILL', '12345'], exitCode: 1, output: '' });

    await expect(killRun({ args: ['-SIGKILL', '12345'], cwd: '/repo' })).rejects.toStrictEqual(
      new KillNotInstalledError(
        'kill -SIGKILL 12345 produced no output and exit code 1 in /repo — kill is likely not installed or not on PATH',
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
