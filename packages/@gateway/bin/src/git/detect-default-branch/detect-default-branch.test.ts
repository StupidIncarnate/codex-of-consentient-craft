import { GitNotInstalledError } from '../git-run/git-not-installed.error';
import { detectDefaultBranch } from './detect-default-branch';
import { detectDefaultBranchProxy } from './detect-default-branch.proxy';

describe('detectDefaultBranch()', () => {
  it('VALID: {main exists} => returns "main"', async () => {
    const proxy = detectDefaultBranchProxy();
    proxy.setupMainExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('main');
  });

  it('VALID: {only master exists} => returns "master"', async () => {
    const proxy = detectDefaultBranchProxy();
    proxy.setupMasterExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('master');
  });

  it('EMPTY: {neither exists} => returns null', async () => {
    const proxy = detectDefaultBranchProxy();
    proxy.setupNeitherExists();

    const result = await detectDefaultBranch({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('ERROR: {setupNotFound} => rejects with GitNotInstalledError naming the first rev-parse', async () => {
    const proxy = detectDefaultBranchProxy();
    proxy.setupNotFound();

    await expect(detectDefaultBranch({ cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git rev-parse --verify main could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = detectDefaultBranchProxy();
      proxy.setupMainExists();

      await detectDefaultBranch({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '--verify', 'main'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
