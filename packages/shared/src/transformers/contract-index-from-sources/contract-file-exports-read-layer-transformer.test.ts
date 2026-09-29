import * as ts from '#gateway/npm/typescript';

import { contractFileExportsReadLayerTransformer } from './contract-file-exports-read-layer-transformer';

describe('contractFileExportsReadLayerTransformer', () => {
  describe('valid input', () => {
    it('VALID: {schema, inferred type} => returns the const and one inferred type', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/thing-contract.ts',
        [
          "export const thingContract = z.string().brand<'Thing'>();",
          'export type Thing = z.infer<typeof thingContract>;',
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractFileExportsReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({
        exportedConstNames: ['thingContract'],
        typeExports: [{ typeName: 'Thing', isSchemaInferred: true, isExempt: false }],
      });
    });

    it('VALID: {function type, generic alias, hand-written object} => flags exempt only the first two', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/thing-contract.ts',
        [
          'export type Handler = () => void;',
          'export type Box<T> = { value: T };',
          'export interface Plain { id: string }',
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractFileExportsReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({
        exportedConstNames: [],
        typeExports: [
          { typeName: 'Handler', isSchemaInferred: false, isExempt: true },
          { typeName: 'Box', isSchemaInferred: false, isExempt: true },
          { typeName: 'Plain', isSchemaInferred: false, isExempt: false },
        ],
      });
    });

    it('VALID: {unexported const, destructured export} => lists only exported identifier consts', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/thing-contract.ts',
        ['const hidden = 1;', 'export const { a } = source;', 'export const shown = 2;'].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractFileExportsReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({ exportedConstNames: ['shown'], typeExports: [] });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {empty file} => returns no consts and no types', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/e-contract.ts',
        '',
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractFileExportsReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({ exportedConstNames: [], typeExports: [] });
    });
  });
});
