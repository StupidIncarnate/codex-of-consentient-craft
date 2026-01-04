import { hasDevDependenciesGuard } from './has-dev-dependencies-guard';

describe('hasDevDependenciesGuard', () => {
  describe('valid inputs', () => {
    it('VALID: {obj: {devDependencies: {}}} => returns true', () => {
      const result = hasDevDependenciesGuard({ obj: { devDependencies: {} } });

      expect(result).toBe(true);
    });

    it('VALID: {obj: {devDependencies: {jest: "^30.0.0"}}} => returns true', () => {
      const result = hasDevDependenciesGuard({
        obj: { devDependencies: { jest: '^30.0.0' } },
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {obj: undefined} => returns false', () => {
      const result = hasDevDependenciesGuard({ obj: undefined });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: null} => returns false', () => {
      const result = hasDevDependenciesGuard({ obj: null });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: {}} => returns false', () => {
      const result = hasDevDependenciesGuard({ obj: {} });

      expect(result).toBe(false);
    });

    it('INVALID: {obj: {devDependencies: null}} => returns false', () => {
      const result = hasDevDependenciesGuard({ obj: { devDependencies: null } });

      expect(result).toBe(false);
    });
  });
});
