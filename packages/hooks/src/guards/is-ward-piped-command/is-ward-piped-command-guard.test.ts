import { isWardPipedCommandGuard } from './is-ward-piped-command-guard';

describe('isWardPipedCommandGuard', () => {
  describe('piped ward commands', () => {
    it('VALID: {command: "npm run ward | grep error"} => returns true', () => {
      const result = isWardPipedCommandGuard({ command: 'npm run ward | grep error' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npm run ward -- --only lint | head -20"} => returns true', () => {
      const result = isWardPipedCommandGuard({
        command: 'npm run ward -- --only lint | head -20',
      });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npm run ward -- --only test | tail -5"} => returns true', () => {
      const result = isWardPipedCommandGuard({
        command: 'npm run ward -- --only test | tail -5',
      });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npm run ward 2>&1 | grep FAIL"} => returns true', () => {
      const result = isWardPipedCommandGuard({ command: 'npm run ward 2>&1 | grep FAIL' });

      expect(result).toBe(true);
    });
  });

  describe('non-piped ward commands', () => {
    it('VALID: {command: "npm run ward"} => returns false', () => {
      const result = isWardPipedCommandGuard({ command: 'npm run ward' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run ward -- --only lint"} => returns false', () => {
      const result = isWardPipedCommandGuard({ command: 'npm run ward -- --only lint' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run ward -- --only test -- path/to/file.test.ts"} => returns false', () => {
      const result = isWardPipedCommandGuard({
        command: 'npm run ward -- --only test -- path/to/file.test.ts',
      });

      expect(result).toBe(false);
    });
  });

  describe('non-ward commands', () => {
    it('VALID: {command: "echo hello | grep hello"} => returns false', () => {
      const result = isWardPipedCommandGuard({ command: 'echo hello | grep hello' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "ls -la"} => returns false', () => {
      const result = isWardPipedCommandGuard({ command: 'ls -la' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {command: undefined} => returns false', () => {
      const result = isWardPipedCommandGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {command: ""} => returns false', () => {
      const result = isWardPipedCommandGuard({ command: '' });

      expect(result).toBe(false);
    });
  });
});
