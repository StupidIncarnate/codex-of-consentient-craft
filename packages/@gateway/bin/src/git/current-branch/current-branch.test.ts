import { currentBranch } from './current-branch';
import { currentBranchProxy } from './current-branch.proxy';

describe('currentBranch()', () => {
  it('VALID: {branch: "main", a warning on stderr} => returns the branch from stdout alone', async () => {
    const proxy = currentBranchProxy();
    proxy.setupBranch({ branch: 'main\n', stderr: "warning: refname 'main' is ambiguous.\n" });

    const result = await currentBranch({ cwd: '/repo' });

    expect(result).toBe('main');
  });

  it('VALID: {branch: "main"} => returns "main"', async () => {
    const proxy = currentBranchProxy();
    proxy.setupBranch({ branch: 'main' });

    const result = await currentBranch({ cwd: '/repo' });

    expect(result).toBe('main');
  });

  it('EDGE: {detached HEAD} => returns null', async () => {
    const proxy = currentBranchProxy();
    proxy.setupDetached();

    const result = await currentBranch({ cwd: '/repo' });

    expect(result).toBe(null);
  });

  it('ERROR: {exitCode: 128, output: "fatal: not a git repository"} => throws', async () => {
    const proxy = currentBranchProxy();
    proxy.setupFailure({ exitCode: 128, output: 'fatal: not a git repository' });

    await expect(currentBranch({ cwd: '/repo' })).rejects.toStrictEqual(
      new Error(
        'git rev-parse --abbrev-ref HEAD failed in /repo with exit code 128: fatal: not a git repository',
      ),
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = currentBranchProxy();
      proxy.setupBranch({ branch: 'main' });

      await currentBranch({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['rev-parse', '--abbrev-ref', 'HEAD'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
