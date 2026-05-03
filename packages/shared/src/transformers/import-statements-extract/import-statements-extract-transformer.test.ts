import { importStatementsExtractTransformer } from './import-statements-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('importStatementsExtractTransformer', () => {
  describe('named imports', () => {
    it('VALID: {source: single named import} => returns one path', () => {
      const source = ContentTextStub({ value: `import { foo } from './foo';` });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([ContentTextStub({ value: './foo' })]);
    });

    it('VALID: {source: multiple named imports} => returns all paths', () => {
      const source = ContentTextStub({
        value: `import { a } from './a';\nimport { b } from './b';`,
      });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([
        ContentTextStub({ value: './a' }),
        ContentTextStub({ value: './b' }),
      ]);
    });
  });

  describe('type imports', () => {
    it('VALID: {source: type import} => returns path', () => {
      const source = ContentTextStub({ value: `import type { Foo } from '../contracts/foo';` });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([ContentTextStub({ value: '../contracts/foo' })]);
    });
  });

  describe('namespace imports', () => {
    it('VALID: {source: namespace import} => returns path', () => {
      const source = ContentTextStub({ value: `import * as fs from 'fs';` });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([ContentTextStub({ value: 'fs' })]);
    });
  });

  describe('default imports', () => {
    it('VALID: {source: default import} => returns path', () => {
      const source = ContentTextStub({ value: `import z from 'zod';` });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([ContentTextStub({ value: 'zod' })]);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {source: no imports} => returns empty array', () => {
      const source = ContentTextStub({ value: `export const foo = 1;` });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {source: mixed imports and exports} => extracts only import paths', () => {
      const source = ContentTextStub({
        value: `import { a } from './a';\nexport const b = 2;\nimport type { C } from './c';`,
      });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([
        ContentTextStub({ value: './a' }),
        ContentTextStub({ value: './c' }),
      ]);
    });

    it('VALID: {source: multi-line destructured import} => returns path', () => {
      const source = ContentTextStub({
        value: `import {\n  foo,\n  bar,\n} from './multi';`,
      });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([ContentTextStub({ value: './multi' })]);
    });

    it('VALID: {source: import inside JSDoc block} => skipped', () => {
      const source = ContentTextStub({
        value: [
          '/**',
          ' * USAGE:',
          " * import { foo } from './fake-from-jsdoc';",
          ' */',
          "import { real } from './real';",
        ].join('\n'),
      });
      const result = importStatementsExtractTransformer({ source });

      expect(result).toStrictEqual([ContentTextStub({ value: './real' })]);
    });
  });
});
