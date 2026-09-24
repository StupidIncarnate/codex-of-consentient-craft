import { isRelativePathEnvValueGuard } from './is-relative-path-env-value-guard';

describe('isRelativePathEnvValueGuard', () => {
  describe('a relative path', () => {
    it('VALID: {value: "packages/web/test/harnesses/claude-mock/bin/claude"} => returns true', () => {
      const result = isRelativePathEnvValueGuard({
        value: 'packages/web/test/harnesses/claude-mock/bin/claude',
      });

      expect(result).toBe(true);
    });
  });

  describe('an absolute path', () => {
    it('INVALID: {value: "/tmp/dm-siege-inst_1"} => returns false', () => {
      const result = isRelativePathEnvValueGuard({ value: '/tmp/dm-siege-inst_1' });

      expect(result).toBe(false);
    });
  });

  describe('a scoped package name', () => {
    it('INVALID: {value: "@dungeonmaster/server"} => returns false', () => {
      const result = isRelativePathEnvValueGuard({ value: '@dungeonmaster/server' });

      expect(result).toBe(false);
    });
  });

  describe('a value with no path separator', () => {
    it('INVALID: {value: "500"} => returns false', () => {
      const result = isRelativePathEnvValueGuard({ value: '500' });

      expect(result).toBe(false);
    });

    it('INVALID: {value: "1"} => returns false', () => {
      const result = isRelativePathEnvValueGuard({ value: '1' });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {value: undefined} => returns false', () => {
      const result = isRelativePathEnvValueGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {value: ""} => returns false', () => {
      const result = isRelativePathEnvValueGuard({ value: '' });

      expect(result).toBe(false);
    });
  });
});
