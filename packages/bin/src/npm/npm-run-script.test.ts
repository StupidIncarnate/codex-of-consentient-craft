import { runScript } from './npm-run-script';
import { runScriptProxy } from './npm-run-script.proxy';

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
});
