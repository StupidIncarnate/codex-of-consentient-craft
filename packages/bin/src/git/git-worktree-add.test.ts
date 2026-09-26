import { worktreeAdd } from './git-worktree-add';
import { worktreeAddProxy } from './git-worktree-add.proxy';

describe('worktreeAdd()', () => {
  it('VALID: {mode: "create-branch"} => runs worktree add -b <branchName> <baseBranch>', async () => {
    const proxy = worktreeAddProxy();
    proxy.setupCreateBranch({
      worktreePath: '/repo/worktrees/foo',
      branchName: 'quest/foo',
      baseBranch: 'main',
      exitCode: 0,
      output: '',
    });

    const result = await worktreeAdd({
      cwd: '/repo',
      worktreePath: '/repo/worktrees/foo',
      branchName: 'quest/foo',
      baseBranch: 'main',
      mode: 'create-branch',
    });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('VALID: {mode: "attach-existing"} => runs worktree add <worktreePath> <branchName>', async () => {
    const proxy = worktreeAddProxy();
    proxy.setupAttachExisting({
      worktreePath: '/repo/worktrees/foo',
      branchName: 'quest/foo',
      exitCode: 0,
      output: '',
    });

    const result = await worktreeAdd({
      cwd: '/repo',
      worktreePath: '/repo/worktrees/foo',
      branchName: 'quest/foo',
      baseBranch: 'main',
      mode: 'attach-existing',
    });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 128, output: "already exists"} => returns it, does not throw', async () => {
    const proxy = worktreeAddProxy();
    proxy.setupCreateBranch({
      worktreePath: '/repo/worktrees/foo',
      branchName: 'quest/foo',
      baseBranch: 'main',
      exitCode: 128,
      output: 'already exists',
    });

    const result = await worktreeAdd({
      cwd: '/repo',
      worktreePath: '/repo/worktrees/foo',
      branchName: 'quest/foo',
      baseBranch: 'main',
      mode: 'create-branch',
    });

    expect(result).toStrictEqual({ exitCode: 128, output: 'already exists' });
  });
});
