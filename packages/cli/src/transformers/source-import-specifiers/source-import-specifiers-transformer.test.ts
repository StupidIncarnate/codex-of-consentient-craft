import { sourceImportSpecifiersTransformer } from './source-import-specifiers-transformer';

describe('sourceImportSpecifiersTransformer', () => {
  it('VALID: {import, export-from, import-equals, relative import} => returns every specifier in order', () => {
    const sourceText = [
      "import { z } from 'zod';",
      "export * from 'elkjs';",
      "import pkgModule = require('left-pad');",
      "import type { Hono } from '#gateway/npm/hono';",
      "import { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';",
    ].join('\n');

    const result = sourceImportSpecifiersTransformer({ sourceText });

    expect(result).toStrictEqual([
      'zod',
      'elkjs',
      'left-pad',
      '#gateway/npm/hono',
      '../../gateway-test-support/parse-and-find-node',
    ]);
  });

  it('EDGE: {an import written inside a string literal} => returns only the real import', () => {
    const sourceText = [
      "import { parse } from '@typescript-eslint/typescript-estree';",
      'export const code = "import a from \'x\';";',
    ].join('\n');

    const result = sourceImportSpecifiersTransformer({ sourceText });

    expect(result).toStrictEqual(['@typescript-eslint/typescript-estree']);
  });

  it('EDGE: {an export list with no module, an import-equals of a namespace, a require in a function} => returns []', () => {
    const sourceText = [
      'const a = 1;',
      'export { a };',
      'namespace Inner { export const b = 2; }',
      'import alias = Inner.b;',
      "export const load = (): unknown => require('lazy-lib');",
    ].join('\n');

    expect(sourceImportSpecifiersTransformer({ sourceText })).toStrictEqual([]);
  });

  it('EMPTY: {no imports} => returns []', () => {
    expect(
      sourceImportSpecifiersTransformer({ sourceText: 'export const a = 1;\n' }),
    ).toStrictEqual([]);
  });
});
