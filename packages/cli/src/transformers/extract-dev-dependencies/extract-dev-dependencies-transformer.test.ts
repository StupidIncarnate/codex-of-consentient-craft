import { extractDevDependenciesTransformer } from './extract-dev-dependencies-transformer';

describe('extractDevDependenciesTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {packageJson: {devDependencies: {jest: "^30"}}} => returns deps', () => {
      const result = extractDevDependenciesTransformer({
        packageJson: { devDependencies: { jest: '^30.0.0' } },
      });

      expect(result).toStrictEqual({ jest: '^30.0.0' });
    });

    it('VALID: {packageJson: {devDependencies: {}}} => returns empty object', () => {
      const result = extractDevDependenciesTransformer({
        packageJson: { devDependencies: {} },
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {packageJson: undefined} => returns empty object', () => {
      const result = extractDevDependenciesTransformer({ packageJson: undefined });

      expect(result).toStrictEqual({});
    });

    it('INVALID: {packageJson: {}} => returns empty object', () => {
      const result = extractDevDependenciesTransformer({ packageJson: {} });

      expect(result).toStrictEqual({});
    });

    it('INVALID: {packageJson: {devDependencies: null}} => returns empty object', () => {
      const result = extractDevDependenciesTransformer({
        packageJson: { devDependencies: null },
      });

      expect(result).toStrictEqual({});
    });
  });
});
