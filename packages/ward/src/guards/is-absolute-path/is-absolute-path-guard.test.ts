import { isAbsolutePathGuard } from './is-absolute-path-guard';

describe('isAbsolutePathGuard', () => {
  describe('absolute paths', () => {
    it('VALID: {path: "/tmp"} => returns true', () => {
      const result = isAbsolutePathGuard({ path: '/tmp' });

      expect(result).toBe(true);
    });

    it('VALID: {path: "C:\\\\Temp"} => returns true', () => {
      const result = isAbsolutePathGuard({ path: 'C:\\Temp' });

      expect(result).toBe(true);
    });
  });

  describe('relative paths', () => {
    it('VALID: {path: "tmp"} => returns false', () => {
      const result = isAbsolutePathGuard({ path: 'tmp' });

      expect(result).toBe(false);
    });

    it('VALID: {path: "C:Temp"} => returns false', () => {
      const result = isAbsolutePathGuard({ path: 'C:Temp' });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {path: undefined} => returns false', () => {
      const result = isAbsolutePathGuard({});

      expect(result).toBe(false);
    });
  });
});
