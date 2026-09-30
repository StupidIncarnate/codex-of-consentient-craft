
import { expandToTsGlobsTransformer } from './expand-to-ts-globs-transformer';

describe('expandToTsGlobsTransformer', () => {
  describe('bare directories', () => {
    it('VALID: {pattern: "src"} => returns ts and tsx globs', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'src',
      });

      expect(result).toStrictEqual(['src/**/*.ts', 'src/**/*.tsx']);
    });

    it('VALID: {pattern: "test"} => returns ts and tsx globs for test dir', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'test',
      });

      expect(result).toStrictEqual(['test/**/*.ts', 'test/**/*.tsx']);
    });
  });

  describe('wildcard patterns', () => {
    it('VALID: {pattern: "src/**/*"} => returns ts and tsx globs', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'src/**/*',
      });

      expect(result).toStrictEqual(['src/**/*.ts', 'src/**/*.tsx']);
    });

    it('VALID: {pattern: "src/.test-tmp/**/*"} => returns ts and tsx globs for dotdir', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'src/.test-tmp/**/*',
      });

      expect(result).toStrictEqual(['src/.test-tmp/**/*.ts', 'src/.test-tmp/**/*.tsx']);
    });
  });

  describe('typescript files kept as-is', () => {
    it('VALID: {pattern: "vite.config.ts"} => returns pattern unchanged', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'vite.config.ts',
      });

      expect(result).toStrictEqual(['vite.config.ts']);
    });

    it('VALID: {pattern: "*.ts"} => returns pattern unchanged', () => {
      const result = expandToTsGlobsTransformer({
        pattern: '*.ts',
      });

      expect(result).toStrictEqual(['*.ts']);
    });

    it('VALID: {pattern: "index.ts"} => returns pattern unchanged', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'index.ts',
      });

      expect(result).toStrictEqual(['index.ts']);
    });

    it('VALID: {pattern: "src/app.tsx"} => returns pattern unchanged', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'src/app.tsx',
      });

      expect(result).toStrictEqual(['src/app.tsx']);
    });
  });

  describe('@types patterns', () => {
    it('VALID: {pattern: "@types/**/*"} => returns ts and d.ts globs', () => {
      const result = expandToTsGlobsTransformer({
        pattern: '@types/**/*',
      });

      expect(result).toStrictEqual(['@types/**/*.ts', '@types/**/*.d.ts']);
    });
  });

  describe('non-ts file with extension', () => {
    it('VALID: {pattern: "vite.config.js"} => returns pattern as-is', () => {
      const result = expandToTsGlobsTransformer({
        pattern: 'vite.config.js',
      });

      expect(result).toStrictEqual(['vite.config.js']);
    });
  });
});
