import { jestDiscoverPatternsTransformer } from './jest-discover-patterns-transformer';

describe('jestDiscoverPatternsTransformer', () => {
  describe('unit with package jest config', () => {
    it('VALID: {checkType: "unit", hasPackageJestConfig: true} => returns src-scoped unit patterns', () => {
      const result = jestDiscoverPatternsTransformer({
        checkType: 'unit',
        hasPackageJestConfig: true,
      });

      expect(result).toStrictEqual({
        patterns: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/**/*.test.js',
          'src/**/*.test.jsx',
        ],
        excludePatterns: [
          '**/*.integration.test.ts',
          '**/*.e2e.test.ts',
          '**/*.integration.test.tsx',
          '**/*.e2e.test.tsx',
          '**/*.integration.test.js',
          '**/*.e2e.test.js',
          '**/*.integration.test.jsx',
          '**/*.e2e.test.jsx',
        ],
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
        patterns: [
          'src/**/*.integration.test.ts',
          'src/**/*.integration.test.tsx',
          'src/**/*.integration.test.js',
          'src/**/*.integration.test.jsx',
        ],
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
        patterns: [
          'src/**/*.test.ts',
          'bin/**/*.test.ts',
          'src/**/*.test.tsx',
          'bin/**/*.test.tsx',
          'src/**/*.test.js',
          'bin/**/*.test.js',
          'src/**/*.test.jsx',
          'bin/**/*.test.jsx',
        ],
        excludePatterns: [
          '**/*.integration.test.ts',
          '**/*.e2e.test.ts',
          '**/*.integration.test.tsx',
          '**/*.e2e.test.tsx',
          '**/*.integration.test.js',
          '**/*.e2e.test.js',
          '**/*.integration.test.jsx',
          '**/*.e2e.test.jsx',
        ],
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
        patterns: [
          'src/**/*.integration.test.ts',
          'bin/**/*.integration.test.ts',
          'src/**/*.integration.test.tsx',
          'bin/**/*.integration.test.tsx',
          'src/**/*.integration.test.js',
          'bin/**/*.integration.test.js',
          'src/**/*.integration.test.jsx',
          'bin/**/*.integration.test.jsx',
        ],
        excludePatterns: [],
      });
    });
  });
});
