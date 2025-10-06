import { testFilePathVariantsTransformer } from './test-file-path-variants-transformer';

describe('testFilePathVariantsTransformer', () => {
  describe('.ts files', () => {
    it('VALID: {sourceFilePath: "/src/user-broker.ts"} => returns all test file variants', () => {
      const result = testFilePathVariantsTransformer({
        sourceFilePath: '/src/user-broker.ts',
      });

      expect(result).toStrictEqual([
        '/src/user-broker.test.ts',
        '/src/user-broker.spec.ts',
        '/src/user-broker.integration.test.ts',
        '/src/user-broker.integration.spec.ts',
        '/src/user-broker.e2e.test.ts',
        '/src/user-broker.e2e.spec.ts',
      ]);
    });
  });

  describe('.tsx files', () => {
    it('VALID: {sourceFilePath: "/src/user-widget.tsx"} => returns all test file variants with .tsx', () => {
      const result = testFilePathVariantsTransformer({
        sourceFilePath: '/src/user-widget.tsx',
      });

      expect(result).toStrictEqual([
        '/src/user-widget.test.tsx',
        '/src/user-widget.spec.tsx',
        '/src/user-widget.integration.test.tsx',
        '/src/user-widget.integration.spec.tsx',
        '/src/user-widget.e2e.test.tsx',
        '/src/user-widget.e2e.spec.tsx',
      ]);
    });
  });

  describe('complex paths', () => {
    it('VALID: {sourceFilePath: "/project/src/brokers/user/fetch/user-fetch-broker.ts"} => returns all variants', () => {
      const result = testFilePathVariantsTransformer({
        sourceFilePath: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      });

      expect(result).toStrictEqual([
        '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
        '/project/src/brokers/user/fetch/user-fetch-broker.spec.ts',
        '/project/src/brokers/user/fetch/user-fetch-broker.integration.test.ts',
        '/project/src/brokers/user/fetch/user-fetch-broker.integration.spec.ts',
        '/project/src/brokers/user/fetch/user-fetch-broker.e2e.test.ts',
        '/project/src/brokers/user/fetch/user-fetch-broker.e2e.spec.ts',
      ]);
    });
  });
});
