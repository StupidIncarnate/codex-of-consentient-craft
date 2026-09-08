import { isBlockedGitStashCommandGuard } from './is-blocked-git-stash-command-guard';

describe('isBlockedGitStashCommandGuard', () => {
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
      const result = isBlockedGitStashCommandGuard({ command });

      expect(result).toBe(true);
    });

    it('VALID: {command: "cd packages/hooks && git stash"} => returns true', () => {
      const result = isBlockedGitStashCommandGuard({
        command: 'cd packages/hooks && git stash',
      });

      expect(result).toBe(true);
    });

    it('VALID: {command: "git stash; npm run build"} => returns true', () => {
      const result = isBlockedGitStashCommandGuard({ command: 'git stash; npm run build' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "git stash list && git stash pop"} => returns true on the pop', () => {
      const result = isBlockedGitStashCommandGuard({ command: 'git stash list && git stash pop' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "git stash pop || echo failed"} => returns true', () => {
      const result = isBlockedGitStashCommandGuard({ command: 'git stash pop || echo failed' });

      expect(result).toBe(true);
    });
  });

  describe('allowed commands — read-only stash subcommands', () => {
    it.each(['git stash list', 'git stash show', 'git stash show -p stash@{0}'])(
      'VALID: {command: "%s"} => returns false',
      (command) => {
        const result = isBlockedGitStashCommandGuard({ command });

        expect(result).toBe(false);
      },
    );

    it('VALID: {command: "git stash list; git stash show"} => returns false', () => {
      const result = isBlockedGitStashCommandGuard({ command: 'git stash list; git stash show' });

      expect(result).toBe(false);
    });
  });

  describe('allowed commands — non-stash', () => {
    it.each([
      'git status',
      'git commit -m "fix"',
      'git show HEAD:package.json',
      'git checkout -- packages/hooks/src/index.ts',
      'npm run stash',
      'npm run ward',
      'ls -la',
      'git log --grep stash',
      'git log --oneline stash',
    ])('VALID: {command: "%s"} => returns false', (command) => {
      const result = isBlockedGitStashCommandGuard({ command });

      expect(result).toBe(false);
    });

    it('VALID: {command: "git log --oneline | head -5"} => returns false', () => {
      const result = isBlockedGitStashCommandGuard({ command: 'git log --oneline | head -5' });

      expect(result).toBe(false);
    });
  });

  describe('empty/undefined command', () => {
    it('EMPTY: {command: undefined} => returns false', () => {
      const result = isBlockedGitStashCommandGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {command: ""} => returns false', () => {
      const result = isBlockedGitStashCommandGuard({ command: '' });

      expect(result).toBe(false);
    });
  });
});
