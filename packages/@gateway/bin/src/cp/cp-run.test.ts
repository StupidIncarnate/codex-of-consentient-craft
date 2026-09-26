import { cpRun } from './cp-run';
import { cpRunProxy } from './cp-run.proxy';
import { CpNotInstalledError } from './cp-not-installed-error';

describe('cpRun()', () => {
  it('VALID: {exitCode: 0} => returns the result unchanged', async () => {
    const proxy = cpRunProxy();
    proxy.setupResult({ args: ['-a', '/src', '/dest'], exitCode: 0, output: '' });

    const result = await cpRun({ args: ['-a', '/src', '/dest'], cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
  });

  it('ERROR: {run throws RunNotFoundError} => throws CpNotInstalledError', async () => {
    const proxy = cpRunProxy();
    proxy.setupNotFound({
      args: ['-a', '/src', '/dest'],
      message: 'spawn cp ENOENT',
    });

    await expect(cpRun({ args: ['-a', '/src', '/dest'], cwd: '/repo' })).rejects.toStrictEqual(
      new CpNotInstalledError(
        'cp -a /src /dest could not start in /repo: "cp" never started: spawn cp ENOENT',
      ),
    );
  });

  it('EDGE: {exitCode: 1, output: "cp: cannot stat"} => returns it, does not throw', async () => {
    const proxy = cpRunProxy();
    proxy.setupResult({
      args: ['-a', '/missing', '/dest'],
      exitCode: 1,
      output: "cp: cannot stat '/missing': No such file or directory",
    });

    const result = await cpRun({ args: ['-a', '/missing', '/dest'], cwd: '/repo' });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: "cp: cannot stat '/missing': No such file or directory",
      signal: null,
      timedOut: false,
    });
  });
});
