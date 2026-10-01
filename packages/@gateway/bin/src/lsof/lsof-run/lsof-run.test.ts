import { lsofRun } from './lsof-run';
import { lsofRunProxy } from './lsof-run.proxy';
import { LsofNotInstalledError } from './lsof-not-installed.error';

describe('lsofRun()', () => {
  it('VALID: {exitCode: 0} => returns the result unchanged', async () => {
    const proxy = lsofRunProxy();
    proxy.setupResult({ args: ['-ti', ':3737'], exitCode: 0, output: '12345\n' });

    const result = await lsofRun({ args: ['-ti', ':3737'], cwd: '/' });

    expect(result).toStrictEqual({
      exitCode: 0,
      output: '12345\n',
      stdout: '12345\n',
      stderr: '',
      signal: null,
      timedOut: false,
    });
  });

  it('ERROR: {run throws RunNotFoundError} => throws LsofNotInstalledError', async () => {
    const proxy = lsofRunProxy();
    proxy.setupNotFound({ args: ['-ti', ':3737'] });

    await expect(lsofRun({ args: ['-ti', ':3737'], cwd: '/' })).rejects.toStrictEqual(
      new LsofNotInstalledError(
        'lsof -ti :3737 could not start: "lsof" never started: ENOENT: open \'lsof\'',
      ),
    );
  });

  it('EDGE: {exitCode: 1, output: ""} => returns the result, does not throw', async () => {
    const proxy = lsofRunProxy();
    proxy.setupResult({ args: ['-ti', ':3737'], exitCode: 1, output: '' });

    const result = await lsofRun({ args: ['-ti', ':3737'], cwd: '/' });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: '',
      stdout: '',
      stderr: '',
      signal: null,
      timedOut: false,
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingArgs, a predicate} => resolves for args the predicate accepts', async () => {
      const proxy = lsofRunProxy();
      proxy.returnsMatchingArgs({
        args: ['-ti', (value) => String(value).startsWith(':')],
        exitCode: 0,
        output: '111\n',
      });

      const result = await lsofRun({ args: ['-ti', ':4242'], cwd: '/' });

      expect(result).toStrictEqual({
        exitCode: 0,
        output: '111\n',
        stdout: '111\n',
        stderr: '',
        signal: null,
        timedOut: false,
      });
    });

    it('ERROR: {throwsMatchingArgs, a predicate} => rejects with LsofNotInstalledError', async () => {
      const proxy = lsofRunProxy();
      proxy.throwsMatchingArgs({
        args: ['-ti', (value) => String(value).startsWith(':')],
      });

      await expect(lsofRun({ args: ['-ti', ':4242'], cwd: '/' })).rejects.toStrictEqual(
        new LsofNotInstalledError(
          'lsof -ti :4242 could not start: "lsof" never started: ENOENT: open \'lsof\'',
        ),
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the real call', async () => {
      const proxy = lsofRunProxy();
      proxy.setupResult({ args: ['-ti', ':3737'], exitCode: 0, output: '111\n' });

      await lsofRun({ args: ['-ti', ':3737'], cwd: '/' });

      expect(proxy.getCallsFor({ args: ['-ti', ':3737'] })).toStrictEqual([
        [{ command: 'lsof', args: ['-ti', ':3737'], cwd: '/' }],
      ]);
    });
  });
});
