import { isWardCommandGuard } from './is-ward-command-guard';

describe('isWardCommandGuard', () => {
  describe('ward commands', () => {
    it('VALID: {command: "npm run ward"} => returns true', () => {
      const result = isWardCommandGuard({ command: 'npm run ward' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npm run ward -- --only unit"} => returns true', () => {
      const result = isWardCommandGuard({ command: 'npm run ward -- --only unit' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npm run ward -- --only lint,typecheck"} => returns true', () => {
      const result = isWardCommandGuard({ command: 'npm run ward -- --only lint,typecheck' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "dungeonmaster-ward --only unit"} => returns true', () => {
      const result = isWardCommandGuard({ command: 'dungeonmaster-ward --only unit' });

      expect(result).toBe(true);
    });

    it('VALID: {command: "npm run ward 2>&1"} => returns true', () => {
      const result = isWardCommandGuard({ command: 'npm run ward 2>&1' });

      expect(result).toBe(true);
    });
  });

  describe('non-ward commands', () => {
    it('VALID: {command: "echo hello"} => returns false', () => {
      const result = isWardCommandGuard({ command: 'echo hello' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm run build"} => returns false', () => {
      const result = isWardCommandGuard({ command: 'npm run build' });

      expect(result).toBe(false);
    });

    it('VALID: {command: "npm test"} => returns false', () => {
      const result = isWardCommandGuard({ command: 'npm test' });

      expect(result).toBe(false);
    });

    it('VALID: {no command} => returns false', () => {
      const result = isWardCommandGuard({});

      expect(result).toBe(false);
    });
  });
});
