import { worktreeAdd } from './worktree-add';
import { worktreeAddProxy } from './worktree-add.proxy';

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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingCreateBranch, a predicate} => resolves for a worktree path the predicate accepts', async () => {
      const proxy = worktreeAddProxy();
      proxy.returnsMatchingCreateBranch({
        worktreePath: (value) => String(value).startsWith('/repo/worktrees/'),
        branchName: 'quest/foo',
        baseBranch: 'main',
        exitCode: 0,
        output: '',
      });

      const result = await worktreeAdd({
        cwd: '/repo',
        worktreePath: '/repo/worktrees/computed-at-runtime',
        branchName: 'quest/foo',
        baseBranch: 'main',
        mode: 'create-branch',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });

    it('VALID: {returnsMatchingAttachExisting, a predicate} => resolves for a worktree path the predicate accepts', async () => {
      const proxy = worktreeAddProxy();
      proxy.returnsMatchingAttachExisting({
        worktreePath: (value) => String(value).startsWith('/repo/worktrees/'),
        branchName: 'quest/foo',
        exitCode: 0,
        output: '',
      });

      const result = await worktreeAdd({
        cwd: '/repo',
        worktreePath: '/repo/worktrees/computed-at-runtime',
        branchName: 'quest/foo',
        baseBranch: 'main',
        mode: 'attach-existing',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = worktreeAddProxy();
      proxy.setupCreateBranch({
        worktreePath: '/repo/worktrees/foo',
        branchName: 'quest/foo',
        baseBranch: 'main',
        exitCode: 0,
        output: '',
      });

      await worktreeAdd({
        cwd: '/worktrees/computed-at-runtime',
        worktreePath: '/repo/worktrees/foo',
        branchName: 'quest/foo',
        baseBranch: 'main',
        mode: 'create-branch',
      });

      expect(proxy.getCallsFor()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['worktree', 'add', '/repo/worktrees/foo', '-b', 'quest/foo', 'main'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
