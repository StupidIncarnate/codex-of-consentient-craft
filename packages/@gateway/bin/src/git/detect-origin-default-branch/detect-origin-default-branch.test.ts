import { GitNotInstalledError } from '../git-run/git-not-installed.error';
import { detectOriginDefaultBranch } from './detect-origin-default-branch';
import { detectOriginDefaultBranchProxy } from './detect-origin-default-branch.proxy';

describe('detectOriginDefaultBranch()', () => {
  it('VALID: {origin/main exists} => returns "origin/main"', async () => {
    const proxy = detectOriginDefaultBranchProxy();
    proxy.setupOriginMainExists();

    const result = await detectOriginDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('origin/main');
  });

  it('VALID: {only origin/master exists} => returns "origin/master"', async () => {
    const proxy = detectOriginDefaultBranchProxy();
    proxy.setupOriginMasterExists();

    const result = await detectOriginDefaultBranch({ cwd: '/repo' });

    expect(result).toBe('origin/master');
  });

  it('EMPTY: {neither exists} => returns null', async () => {
    const proxy = detectOriginDefaultBranchProxy();
    proxy.setupNeitherExists();

    const result = await detectOriginDefaultBranch({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('ERROR: {setupNotFound} => rejects with GitNotInstalledError naming the first rev-parse', async () => {
    const proxy = detectOriginDefaultBranchProxy();
    proxy.setupNotFound();

    await expect(detectOriginDefaultBranch({ cwd: '/repo' })).rejects.toStrictEqual(
      new GitNotInstalledError(
        'git rev-parse --verify origin/main could not start in /repo: "git" never started: ENOENT: open \'git\'',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = detectOriginDefaultBranchProxy();
      proxy.setupOriginMainExists();

      await detectOriginDefaultBranch({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '--verify', 'origin/main'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
