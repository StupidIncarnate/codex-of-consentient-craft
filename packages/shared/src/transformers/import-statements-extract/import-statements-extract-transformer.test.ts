import { importStatementsExtractTransformer } from './import-statements-extract-transformer';

describe('importStatementsExtractTransformer', () => {
  describe('named imports', () => {
    it('VALID: {source: single named import} => returns one path', () => {
      const source = `import { foo } from './foo';`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual(['./foo']);
    });

    it('VALID: {source: multiple named imports} => returns all paths', () => {
      const source = `import { a } from './a';\nimport { b } from './b';`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([
        './a',
        './b',
      ]);
    });
  });

  describe('type imports', () => {
    it('VALID: {source: type import} => returns path', () => {
      const source = `import type { Foo } from '../contracts/foo';`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual(['../contracts/foo']);
    });
  });

  describe('namespace imports', () => {
    it('VALID: {source: namespace import} => returns path', () => {
      const source = `import * as fs from 'fs';`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual(['fs']);
    });
  });

  describe('default imports', () => {
    it('VALID: {source: default import} => returns path', () => {
      const source = `import z from 'zod';`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual(['zod']);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {source: no imports} => returns empty array', () => {
      const source = `export const foo = 1;`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {source: mixed imports and exports} => extracts only import paths', () => {
      const source = `import { a } from './a';\nexport const b = 2;\nimport type { C } from './c';`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([
        './a',
        './c',
      ]);
    });

    it('VALID: {source: multi-line destructured import} => returns path', () => {
      const source = `import {\n  foo,\n  bar,\n} from './multi';`;
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual(['./multi']);
    });

    it('VALID: {source: import inside JSDoc block} => skipped', () => {
      const source = [
          '/**',
          ' * USAGE:',
          " * import { foo } from './fake-from-jsdoc';",
          ' */',
          "import { real } from './real';",
        ].join('\n');
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual(['./real']);
    });
  });
});
