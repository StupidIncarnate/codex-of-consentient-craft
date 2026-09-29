import * as ts from '#gateway/npm/typescript';

import { moduleLinksReadLayerTransformer } from './module-links-read-layer-transformer';

describe('moduleLinksReadLayerTransformer', () => {
  describe('imports', () => {
    it('VALID: {named, aliased, type-only imports} => returns one link per binding', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/a.ts',
        [
          "import { aContract, bContract as renamed } from './x';",
          "import type { Thing } from './y';",
          "import { type Other, valueThing } from './z';",
          "import defaultThing from './d';",
          "import * as everything from './e';",
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = moduleLinksReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({
        imports: [
          {
            localName: 'aContract',
            importedName: 'aContract',
            specifier: './x',
            isTypeOnly: false,
          },
          { localName: 'renamed', importedName: 'bContract', specifier: './x', isTypeOnly: false },
          { localName: 'Thing', importedName: 'Thing', specifier: './y', isTypeOnly: true },
          { localName: 'Other', importedName: 'Other', specifier: './z', isTypeOnly: true },
          {
            localName: 'valueThing',
            importedName: 'valueThing',
            specifier: './z',
            isTypeOnly: false,
          },
        ],
        reExports: [],
      });
    });
  });

  describe('re-exports', () => {
    it('VALID: {star and named re-exports} => returns each edge with its kind', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/barrel.ts',
        [
          "export * from './a';",
          "export { bContract, cContract as dContract } from './b';",
          'export const local = 1;',
          'export { local as again };',
          "export * as ns from './n';",
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = moduleLinksReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({
        imports: [],
        reExports: [
          { kind: 'star', exportedName: '*', sourceName: '*', specifier: './a' },
          { kind: 'named', exportedName: 'bContract', sourceName: 'bContract', specifier: './b' },
          { kind: 'named', exportedName: 'dContract', sourceName: 'cContract', specifier: './b' },
        ],
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no imports or exports} => returns empty lists', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/e.ts',
        'const a = 1;',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = moduleLinksReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({ imports: [], reExports: [] });
    });
  });
});
