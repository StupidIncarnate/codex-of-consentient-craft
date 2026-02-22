import { isBlockedQualityCommandGuard } from './is-blocked-quality-command-guard';

describe('isBlockedQualityCommandGuard', () => {
  describe('blocked commands', () => {
    it('VALID: {command: "jest"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'jest' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "jest --verbose"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'jest --verbose' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npx jest"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npx jest' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npx jest --coverage"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npx jest --coverage' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "eslint"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'eslint' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "eslint src/"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'eslint src/' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npx eslint"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npx eslint' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npx eslint --fix src/"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npx eslint --fix src/' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "tsc"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'tsc' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "tsc --noEmit"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'tsc --noEmit' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npx tsc"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npx tsc' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npx tsc --noEmit --project tsconfig.json"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({
        command: 'npx tsc --noEmit --project tsconfig.json',
      });

      expect(result).toBe(true);
    });

    it('VALID: {command with chained blocked command} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'cd src && jest' });

      expect(result).toBe(true);
    });

    it('VALID: {command with semicolon chained blocked command} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'cd src; eslint .' });

      expect(result).toBe(true);
    });

    it('VALID: {command with or-chained blocked command} => returns true', () => {
      const result = isBlockedQualityCommandGuard({ command: 'echo test || tsc' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npx dungeonmaster-ward run --only test"} => returns true', () => {
      const result = isBlockedQualityCommandGuard({
        command: 'npx dungeonmaster-ward run --only test',
      });

      expect(result).toBe(true);
    });
  });

  describe('allowed commands', () => {
    it('VALID: {command: "dungeonmaster-ward"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'dungeonmaster-ward' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run test"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npm run test' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run lint"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npm run lint' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run typecheck"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npm run typecheck' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm test"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npm test' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm test -- path/to/file"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npm test -- path/to/file' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run ward"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npm run ward' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "echo hello"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'echo hello' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "ls -la"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'ls -la' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "git status"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'git status' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run test -- --verbose"} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'npm run test -- --verbose' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "dungeonmaster-ward \\"*pattern*\\""} => returns false', () => {
      const result = isBlockedQualityCommandGuard({ command: 'dungeonmaster-ward "*pattern*"' });

      expect(result).toBe(false);
    });
  });

  describe('empty/undefined command', () => {
    it('EMPTY: {command: undefined} => returns false', () => {
      const result = isBlockedQualityCommandGuard({});

      expect(result).toBe(false);
    });
  });
});
