import { npmRun } from './npm-run';
import { npmRunProxy } from './npm-run.proxy';
import { NpmNotInstalledError } from './npm-not-installed-error';

describe('npmRun()', () => {
  it('VALID: {exitCode: 0} => returns the result unchanged', async () => {
    const proxy = npmRunProxy();
    proxy.setupResult({ args: ['install'], exitCode: 0, output: 'added 1 package' });

    const result = await npmRun({ args: ['install'], cwd: '/repo' });

    expect(result).toStrictEqual({
      exitCode: 0,
      output: 'added 1 package',
      signal: null,
      timedOut: false,
    });
  });

  it('ERROR: {run throws RunNotFoundError} => throws NpmNotInstalledError', async () => {
    const proxy = npmRunProxy();
    proxy.setupNotFound({ args: ['install'], message: 'spawn npm ENOENT' });

    await expect(npmRun({ args: ['install'], cwd: '/repo' })).rejects.toStrictEqual(
      new NpmNotInstalledError(
        'npm install could not start in /repo: "npm" never started: spawn npm ENOENT',
      ),
    );
  });

  it('EDGE: {exitCode: 1, output: "npm ERR!..."} => returns the result, does not throw', async () => {
    const proxy = npmRunProxy();
    proxy.setupResult({ args: ['install'], exitCode: 1, output: 'npm ERR! missing script' });

    const result = await npmRun({ args: ['install'], cwd: '/repo' });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: 'npm ERR! missing script',
      signal: null,
      timedOut: false,
    });
  });
});
