import { isGitNotARepositoryErrorGuard } from './is-git-not-a-repository-error-guard';

describe('isGitNotARepositoryErrorGuard', () => {
  describe('git reporting no repository here', () => {
    it('VALID: {message: "fatal: not a git repository"} => returns true', () => {
      const error = new Error(
        'git rev-parse --abbrev-ref HEAD failed in /tmp/x with exit code 128: fatal: not a git repository',
      );

      const result = isGitNotARepositoryErrorGuard({ error });

      expect(result).toBe(true);
    });

    it('VALID: {message: the fuller "not a git repository (or any of the parent directories)" text} => returns true', () => {
      const error = new Error(
        'git rev-parse --abbrev-ref HEAD failed in /tmp/x with exit code 128: fatal: not a git repository (or any of the parent directories): .git',
      );

      const result = isGitNotARepositoryErrorGuard({ error });

      expect(result).toBe(true);
    });
  });

  describe('a real failure that is not this one', () => {
    it('INVALID: {message: a permission failure} => returns false', () => {
      const error = new Error(
        'git rev-parse --abbrev-ref HEAD failed in /tmp/x with exit code 128: fatal: detected dubious ownership in repository',
      );

      const result = isGitNotARepositoryErrorGuard({ error });

      expect(result).toBe(false);
    });

    it('INVALID: {message: a GitNotInstalledError-shaped message} => returns false', () => {
      const error = new Error(
        'git rev-parse --abbrev-ref HEAD could not start in /tmp/x: spawn git ENOENT',
      );

      const result = isGitNotARepositoryErrorGuard({ error });

      expect(result).toBe(false);
    });

    it('INVALID: {error: a bare string, not an Error} => returns false', () => {
      const result = isGitNotARepositoryErrorGuard({ error: 'fatal: not a git repository' });

      expect(result).toBe(false);
    });
  });

  describe('values that carry no message at all', () => {
    it('EMPTY: {error: undefined} => returns false', () => {
      const result = isGitNotARepositoryErrorGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {error: null} => returns false', () => {
      const result = isGitNotARepositoryErrorGuard({ error: null });

      expect(result).toBe(false);
    });
  });
});
