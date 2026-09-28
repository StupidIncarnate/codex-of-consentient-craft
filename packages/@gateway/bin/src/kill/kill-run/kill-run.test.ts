import { killRun } from './kill-run';
import { killRunProxy } from './kill-run.proxy';
import { KillNotInstalledError } from './kill-not-installed.error';

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
    });

    await expect(killRun({ args: ['-SIGKILL', '12345'], cwd: '/repo' })).rejects.toStrictEqual(
      new KillNotInstalledError(
        'kill -SIGKILL 12345 could not start in /repo: "kill" never started: ENOENT: open \'kill\'',
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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingArgs, a predicate} => resolves for args the predicate accepts', async () => {
      const proxy = killRunProxy();
      proxy.returnsMatchingArgs({
        args: ['-SIGKILL', (value) => Number(value) > 0],
        exitCode: 0,
        output: '',
      });

      const result = await killRun({ args: ['-SIGKILL', '54321'], cwd: '/repo' });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
    });

    it('ERROR: {throwsMatchingArgs, a predicate} => rejects with KillNotInstalledError', async () => {
      const proxy = killRunProxy();
      proxy.throwsMatchingArgs({
        args: ['-SIGKILL', (value) => Number(value) > 0],
      });

      await expect(killRun({ args: ['-SIGKILL', '54321'], cwd: '/repo' })).rejects.toStrictEqual(
        new KillNotInstalledError(
          'kill -SIGKILL 54321 could not start in /repo: "kill" never started: ENOENT: open \'kill\'',
        ),
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = killRunProxy();
      proxy.setupResult({ args: ['-SIGKILL', '12345'], exitCode: 0, output: '' });

      await killRun({ args: ['-SIGKILL', '12345'], cwd: '/' });

      expect(proxy.getCallsFor({ args: ['-SIGKILL', '12345'] })).toStrictEqual([
        [{ command: 'kill', args: ['-SIGKILL', '12345'], cwd: '/' }],
      ]);
    });
  });
});
