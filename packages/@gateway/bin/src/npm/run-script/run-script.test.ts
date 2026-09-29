import { NpmNotInstalledError } from '../npm-run/npm-not-installed.error';
import { runScript } from './run-script';
import { runScriptProxy } from './run-script.proxy';

describe('runScript()', () => {
  it('VALID: {script: "build"} => runs npm run build', async () => {
    const proxy = runScriptProxy();
    proxy.setupResult({ script: 'build', exitCode: 0, output: '' });

    const result = await runScript({ cwd: '/repo', script: 'build' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('VALID: {script, workspace, args} => runs npm run <script> --workspace=<name> <args>', async () => {
    const proxy = runScriptProxy();
    proxy.setupResult({
      script: 'build',
      workspace: '@scope/pkg',
      args: ['--outDir', '/tmp/out'],
      exitCode: 0,
      output: '',
    });

    const result = await runScript({
      cwd: '/repo',
      workspace: '@scope/pkg',
      script: 'build',
      args: ['--outDir', '/tmp/out'],
    });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "npm ERR! Missing script"} => returns it, does not throw', async () => {
    const proxy = runScriptProxy();
    proxy.setupResult({ script: 'missing', exitCode: 1, output: 'npm ERR! Missing script' });

    const result = await runScript({ cwd: '/repo', script: 'missing' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'npm ERR! Missing script' });
  });

  it('ERROR: {setupNotFound, script + args} => rejects with NpmNotInstalledError naming the full command', async () => {
    const proxy = runScriptProxy();
    proxy.setupNotFound({ script: 'build', args: ['--outDir', '/tmp/out'] });

    await expect(
      runScript({ cwd: '/repo', script: 'build', args: ['--outDir', '/tmp/out'] }),
    ).rejects.toStrictEqual(
      new NpmNotInstalledError(
        'npm run build --outDir /tmp/out could not start in /repo: "npm" never started: ENOENT: open \'npm\'',
      ),
    );
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingScript, a predicate} => resolves for a script name the predicate accepts', async () => {
      const proxy = runScriptProxy();
      proxy.returnsMatchingScript({
        script: (value) => String(value).startsWith('build'),
        exitCode: 0,
        output: '',
      });

      const result = await runScript({ cwd: '/repo', script: 'build:computed-at-runtime' });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = runScriptProxy();
      proxy.setupResult({ script: 'build', exitCode: 0, output: '' });

      await runScript({ cwd: '/worktrees/computed-at-runtime', script: 'build' });

      expect(proxy.getCallsFor({ script: 'build' })).toStrictEqual([
        [{ command: 'npm', args: ['run', 'build'], cwd: '/worktrees/computed-at-runtime' }],
      ]);
    });
  });
});
