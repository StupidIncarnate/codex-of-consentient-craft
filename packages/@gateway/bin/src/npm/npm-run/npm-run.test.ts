import { npmRun } from './npm-run';
import { npmRunProxy } from './npm-run.proxy';
import { NpmNotInstalledError } from '../npm-not-installed-error/npm-not-installed-error';

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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingArgs, a predicate} => resolves for args the predicate accepts', async () => {
      const proxy = npmRunProxy();
      proxy.returnsMatchingArgs({
        args: ['run', 'build', (value) => String(value).startsWith('--workspace=')],
        exitCode: 0,
        output: '',
      });

      const result = await npmRun({
        args: ['run', 'build', '--workspace=@dungeonmaster/computed-at-runtime'],
        cwd: '/repo',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
    });

    it('ERROR: {throwsMatchingArgs, a predicate} => rejects with NpmNotInstalledError', async () => {
      const proxy = npmRunProxy();
      proxy.throwsMatchingArgs({
        args: ['run', 'build', (value) => String(value).startsWith('--workspace=')],
        message: 'spawn npm ENOENT',
      });

      await expect(
        npmRun({
          args: ['run', 'build', '--workspace=@dungeonmaster/computed-at-runtime'],
          cwd: '/repo',
        }),
      ).rejects.toStrictEqual(
        new NpmNotInstalledError(
          'npm run build --workspace=@dungeonmaster/computed-at-runtime could not start in /repo: "npm" never started: spawn npm ENOENT',
        ),
      );
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = npmRunProxy();
      proxy.setupResult({ args: ['install'], exitCode: 0, output: '' });

      await npmRun({ args: ['install'], cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor({ args: ['install'] })).toStrictEqual([
        [{ command: 'npm', args: ['install'], cwd: '/worktrees/computed-at-runtime' }],
      ]);
    });
  });
});
