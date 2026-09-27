import { runBuild } from './run-build';
import { runBuildProxy } from './run-build.proxy';

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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingWorkspace, a predicate} => resolves for a workspace the predicate accepts', async () => {
      const proxy = runBuildProxy();
      proxy.returnsMatchingWorkspace({
        workspace: (value) => String(value).startsWith('@dungeonmaster/'),
        exitCode: 0,
        output: '',
      });

      const result = await runBuild({ cwd: '/repo', workspace: '@dungeonmaster/computed' });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = runBuildProxy();
      proxy.setupResult({ workspace: '@scope/pkg', exitCode: 0, output: '' });

      await runBuild({ cwd: '/worktrees/computed-at-runtime', workspace: '@scope/pkg' });

      expect(proxy.getCallsFor({ workspace: '@scope/pkg' })).toStrictEqual([
        [
          {
            command: 'npm',
            args: ['run', 'build', '--workspace=@scope/pkg'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
