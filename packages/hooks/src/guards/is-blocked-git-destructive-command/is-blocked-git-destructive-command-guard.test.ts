import { isBlockedGitDestructiveCommandGuard } from './is-blocked-git-destructive-command-guard';

describe('isBlockedGitDestructiveCommandGuard', () => {
  describe('blocked commands — a stash that moves the tree', () => {
    it.each([
      'git stash',
      'git stash push',
      'git stash push -m "wip"',
      'git stash save',
      'git stash pop',
      'git stash apply',
      'git stash drop',
      'git stash clear',
      'git stash -u',
      'git stash --include-untracked',
      'git -C /repo stash',
      'git --git-dir=/repo/.git stash',
      'git --work-tree /repo stash pop',
      'git --no-pager stash pop',
      'git   stash',
    ])('VALID: {command: "%s"} => returns true', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(true);
    });
  });

  describe('blocked commands — a reset carrying any argument', () => {
    it.each([
      'git reset --hard',
      'git reset --hard HEAD~1',
      'git reset --hard origin/master',
      'git reset --merge',
      'git reset --keep HEAD~1',
      'git reset --soft HEAD~1',
      'git reset HEAD~1',
      'git -C /repo reset --hard',
    ])('VALID: {command: "%s"} => returns true', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(true);
    });
  });

  describe('blocked commands — a clean that is not a dry run', () => {
    it.each(['git clean -f', 'git clean -fd', 'git clean -xfd', 'git clean --force'])(
      'VALID: {command: "%s"} => returns true',
      (command) => {
        const result = isBlockedGitDestructiveCommandGuard({ command });

        expect(result).toBe(true);
      },
    );
  });

  describe('blocked commands — a rebase that is not an escape', () => {
    it.each([
      'git rebase',
      'git rebase master',
      'git rebase -i HEAD~3',
      'git rebase --continue',
      'git rebase --skip',
      'git rebase --onto master feature',
    ])('VALID: {command: "%s"} => returns true', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(true);
    });
  });

  describe('blocked commands — a checkout that overwrites a path', () => {
    it.each([
      'git checkout -- src/index.ts',
      'git checkout -- .',
      'git checkout --',
      'git checkout HEAD -- src/index.ts',
      'git checkout .',
      'git checkout   .',
    ])('VALID: {command: "%s"} => returns true', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(true);
    });
  });

  describe('blocked commands — a restore that touches the working tree', () => {
    it.each([
      'git restore src/index.ts',
      'git restore .',
      'git restore --worktree src/index.ts',
      'git restore --staged --worktree src/index.ts',
    ])('VALID: {command: "%s"} => returns true', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(true);
    });
  });

  describe('blocked commands — reached through a shell separator', () => {
    it('VALID: {command: "cd packages/hooks && git stash"} => returns true', () => {
      const result = isBlockedGitDestructiveCommandGuard({
        command: 'cd packages/hooks && git stash',
      });

      expect(result).toBe(true);
    });

    it('VALID: {command: "git stash; npm run build"} => returns true', () => {
      const result = isBlockedGitDestructiveCommandGuard({ command: 'git stash; npm run build' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "git stash list && git stash pop"} => returns true on the pop', () => {
      const result = isBlockedGitDestructiveCommandGuard({
        command: 'git stash list && git stash pop',
      });

      expect(result).toBe(true);
    });

    it('VALID: {command: "git checkout main && git checkout -- a.ts"} => returns true on the second', () => {
      const result = isBlockedGitDestructiveCommandGuard({
        command: 'git checkout main && git checkout -- a.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {command: "git stash pop || echo failed"} => returns true', () => {
      const result = isBlockedGitDestructiveCommandGuard({
        command: 'git stash pop || echo failed',
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed commands — the read-only form of a blocked verb', () => {
    it.each([
      'git stash list',
      'git stash show',
      'git stash show -p stash@{0}',
      'git reset',
      'git clean -n',
      'git clean --dry-run',
      'git rebase --abort',
      'git rebase --quit',
      'git restore --staged src/index.ts',
    ])('VALID: {command: "%s"} => returns false', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(false);
    });

    it('VALID: {command: "git stash list; git stash show"} => returns false', () => {
      const result = isBlockedGitDestructiveCommandGuard({
        command: 'git stash list; git stash show',
      });

      expect(result).toBe(false);
    });
  });

  describe('allowed commands — a checkout that only moves the branch', () => {
    it.each([
      'git checkout master',
      'git checkout -b feature/thing',
      'git checkout -B feature/thing',
      'git checkout --force master',
      'git checkout origin/master',
    ])('VALID: {command: "%s"} => returns false', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(false);
    });
  });

  describe('allowed commands — no blocked verb at all', () => {
    it.each([
      'git status',
      'git commit -m "fix"',
      'git show HEAD:package.json',
      'git push',
      'git merge master',
      'git add -A',
      'npm run stash',
      'npm run ward',
      'ls -la',
      'git log --grep stash',
      'git log --oneline stash',
      'git config --global alias.co checkout',
    ])('VALID: {command: "%s"} => returns false', (command) => {
      const result = isBlockedGitDestructiveCommandGuard({ command });

      expect(result).toBe(false);
    });

    it('VALID: {command: "git log --oneline | head -5"} => returns false', () => {
      const result = isBlockedGitDestructiveCommandGuard({
        command: 'git log --oneline | head -5',
      });

      expect(result).toBe(false);
    });
  });

  describe('empty/undefined command', () => {
    it('EMPTY: {command: undefined} => returns false', () => {
      const result = isBlockedGitDestructiveCommandGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {command: ""} => returns false', () => {
      const result = isBlockedGitDestructiveCommandGuard({ command: '' });

      expect(result).toBe(false);
    });
  });
});
