import { jestDiscoverPatternsTransformer } from './jest-discover-patterns-transformer';

describe('jestDiscoverPatternsTransformer', () => {
  describe('unit with package jest config', () => {
    it('VALID: {checkType: "unit", hasPackageJestConfig: true} => returns src-scoped unit patterns', () => {
      const result = jestDiscoverPatternsTransformer({
        checkType: 'unit',
        hasPackageJestConfig: true,
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.test.ts'],
        excludePatterns: ['**/*.integration.test.ts', '**/*.e2e.test.ts'],
      });
    });
  });

  describe('integration with package jest config', () => {
    it('VALID: {checkType: "integration", hasPackageJestConfig: true} => returns src-scoped integration patterns', () => {
      const result = jestDiscoverPatternsTransformer({
        checkType: 'integration',
        hasPackageJestConfig: true,
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.integration.test.ts'],
        excludePatterns: [],
      });
    });
  });

  describe('unit without package jest config', () => {
    it('VALID: {checkType: "unit", hasPackageJestConfig: false} => returns fallback unit patterns', () => {
      const result = jestDiscoverPatternsTransformer({
        checkType: 'unit',
        hasPackageJestConfig: false,
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.test.ts', 'bin/**/*.test.ts'],
        excludePatterns: ['**/*.integration.test.ts', '**/*.e2e.test.ts'],
      });
    });
  });

  describe('integration without package jest config', () => {
    it('VALID: {checkType: "integration", hasPackageJestConfig: false} => returns fallback integration patterns', () => {
      const result = jestDiscoverPatternsTransformer({
        checkType: 'integration',
        hasPackageJestConfig: false,
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.integration.test.ts', 'bin/**/*.integration.test.ts'],
        excludePatterns: [],
      });
    });
  });
});
