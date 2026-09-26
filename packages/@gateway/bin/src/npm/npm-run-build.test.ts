import { runBuild } from './npm-run-build';
import { runBuildProxy } from './npm-run-build.proxy';

describe('runBuild()', () => {
  it('VALID: {workspace: "@scope/pkg"} => runs npm run build --workspace=@scope/pkg', async () => {
    const proxy = runBuildProxy();
    proxy.setupResult({ workspace: '@scope/pkg', exitCode: 0, output: '' });

    const result = await runBuild({ cwd: '/repo', workspace: '@scope/pkg' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "npm ERR! Missing script"} => returns it, does not throw', async () => {
    const proxy = runBuildProxy();
    proxy.setupResult({ workspace: '@scope/pkg', exitCode: 1, output: 'npm ERR! Missing script' });

    const result = await runBuild({ cwd: '/repo', workspace: '@scope/pkg' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'npm ERR! Missing script' });
  });
});
