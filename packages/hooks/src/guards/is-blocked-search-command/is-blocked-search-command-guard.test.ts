import { isBlockedSearchCommandGuard } from './is-blocked-search-command-guard';

describe('isBlockedSearchCommandGuard', () => {
  describe('blocked commands', () => {
    it('VALID: {command: "grep pattern src/"} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'grep pattern src/' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "grep -rn pattern ."} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'grep -rn pattern .' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "rg pattern"} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'rg pattern' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "rg -l pattern src/"} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'rg -l pattern src/' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "find . -name *.ts"} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'find . -name *.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "find packages/ -type f"} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'find packages/ -type f' });

      expect(result).toBe(true);
    });

    it('VALID: {command with chained search} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'cd src && grep -r pattern .' });

      expect(result).toBe(true);
    });

    it('VALID: {command with semicolon chained search} => returns true', () => {
      const result = isBlockedSearchCommandGuard({ command: 'cd src; find . -name *.ts' });

      expect(result).toBe(true);
    });
  });

  describe('allowed commands — piped uses are legitimate', () => {
    it('VALID: {command: "npm run ward | grep error"} => returns false (piped)', () => {
      const result = isBlockedSearchCommandGuard({ command: 'npm run ward | grep error' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "git log | grep fix"} => returns false (piped)', () => {
      const result = isBlockedSearchCommandGuard({ command: 'git log | grep fix' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "ls -la | grep test"} => returns false (piped)', () => {
      const result = isBlockedSearchCommandGuard({ command: 'ls -la | grep test' });

      expect(result).toBe(false);
    });
  });

  describe('allowed commands — non-search', () => {
    it('VALID: {command: "echo hello"} => returns false', () => {
      const result = isBlockedSearchCommandGuard({ command: 'echo hello' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "ls -la"} => returns false', () => {
      const result = isBlockedSearchCommandGuard({ command: 'ls -la' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "git status"} => returns false', () => {
      const result = isBlockedSearchCommandGuard({ command: 'git status' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run ward"} => returns false', () => {
      const result = isBlockedSearchCommandGuard({ command: 'npm run ward' });

      expect(result).toBe(false);
    });
  });

  describe('empty/undefined command', () => {
    it('EMPTY: {command: undefined} => returns false', () => {
      const result = isBlockedSearchCommandGuard({});

      expect(result).toBe(false);
    });
  });
});
