import * as ts from '#gateway/npm/typescript';
import { sourceFactsExtractStatementsLayerBroker } from './source-facts-extract-statements-layer-broker';
import { sourceFactsExtractStatementsLayerBrokerProxy } from './source-facts-extract-statements-layer-broker.proxy';

const parse = ({ text }: { text: string }): ts.SourceFile =>
  ts.createSourceFile('x.ts', text, ts.ScriptTarget.Latest, true);

describe('sourceFactsExtractStatementsLayerBroker', () => {
  describe('imports', () => {
    it('VALID: {default, namespace and aliased named imports} => the names as written at the source', () => {
      sourceFactsExtractStatementsLayerBrokerProxy();

      const result = sourceFactsExtractStatementsLayerBroker({
        sourceFile: parse({
          text: [
            "import path from 'path';",
            "import * as fs from 'fs';",
            "import { readFile as read, type Stats, writeFile } from 'fs/promises';",
            "import 'side-effect';",
          ].join('\n'),
        }),
      });

      expect(result.imports).toStrictEqual([
        { specifier: 'path', names: ['default'] },
        { specifier: 'fs', names: ['*'] },
        { specifier: 'fs/promises', names: ['readFile', 'writeFile'] },
        { specifier: 'side-effect', names: [] },
      ]);
    });

    it('VALID: {import type} => not recorded', () => {
      sourceFactsExtractStatementsLayerBrokerProxy();

      const result = sourceFactsExtractStatementsLayerBroker({
        sourceFile: parse({ text: "import type { A } from './a';" }),
      });

      expect(result.imports).toStrictEqual([]);
    });
  });

  describe('re-exports', () => {
    it('VALID: {star, named, aliased, namespace and type-only} => the names an importer sees', () => {
      sourceFactsExtractStatementsLayerBrokerProxy();

      const result = sourceFactsExtractStatementsLayerBroker({
        sourceFile: parse({
          text: [
            "export * from './a';",
            "export { b as bee, type C } from './b';",
            "export * as ns from './c';",
            "export type { D } from './d';",
          ].join('\n'),
        }),
      });

      expect(result.reExports).toStrictEqual([
        { specifier: './a', names: [], isStar: true },
        { specifier: './b', names: ['bee'], isStar: false },
        { specifier: './c', names: ['ns'], isStar: false },
      ]);
    });
  });

  describe('defined names', () => {
    it('VALID: {exported const, function, class, enum, list and default} => each name once', () => {
      sourceFactsExtractStatementsLayerBrokerProxy();

      const result = sourceFactsExtractStatementsLayerBroker({
        sourceFile: parse({
          text: [
            'export const one = 1, two = 2;',
            'export function three() {}',
            'export class Four {}',
            'export enum Five { A }',
            'const six = 6; const seven = 7;',
            'export { six, seven as sevenAlias };',
            'export default six;',
            'export type Eight = string;',
            'const notExported = 0;',
          ].join('\n'),
        }),
      });

      expect(result.exportNames).toStrictEqual([
        'one',
        'two',
        'three',
        'Four',
        'Five',
        'six',
        'sevenAlias',
        'default',
      ]);
    });

    it('EMPTY: {a file with no statements} => nothing', () => {
      sourceFactsExtractStatementsLayerBrokerProxy();

      const result = sourceFactsExtractStatementsLayerBroker({ sourceFile: parse({ text: '' }) });

      expect(result).toStrictEqual({ imports: [], reExports: [], exportNames: [] });
    });
  });
});
