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
