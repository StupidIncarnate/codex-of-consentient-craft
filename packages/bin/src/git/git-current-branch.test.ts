import { currentBranch } from './git-current-branch';
import { gitCurrentBranchProxy } from './git-current-branch.proxy';

describe('currentBranch()', () => {
  it('VALID: {branch: "main"} => returns "main"', async () => {
    const proxy = gitCurrentBranchProxy();
    proxy.setupBranch({ branch: 'main' });

    const result = await currentBranch({ cwd: '/repo' });

    expect(result).toBe('main');
  });

  it('EDGE: {detached HEAD} => returns null', async () => {
    const proxy = gitCurrentBranchProxy();
    proxy.setupDetached();

    const result = await currentBranch({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('ERROR: {exitCode: 128, output: "fatal: not a git repository"} => throws', async () => {
    const proxy = gitCurrentBranchProxy();
    proxy.setupFailure({ exitCode: 128, output: 'fatal: not a git repository' });

    await expect(currentBranch({ cwd: '/repo' })).rejects.toStrictEqual(
      new Error(
        'git rev-parse --abbrev-ref HEAD failed in /repo with exit code 128: fatal: not a git repository',
      ),
    );
  });
});
