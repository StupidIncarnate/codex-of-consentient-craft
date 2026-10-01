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

    it('VALID: {types-only file of a call-signature property and a length-plus-functions interface} => no consts and every type exempt', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/mock-handle-contract.ts',
        [
          'export type MockHandle = {',
          '  calledWith: (args: readonly unknown[]) => MockStaging;',
          '  callsMatching: {',
          '    (args: readonly []): RecordedCalls;',
          '    (args: readonly unknown[]): unknown[][];',
          '  };',
          '};',
          'export interface RecordedCalls {',
          '  readonly length: number;',
          '  map: <U>(fn: (call: unknown[], index: number) => U) => U[];',
          '  [Symbol.iterator]: () => IterableIterator<unknown[]>;',
          '}',
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractFileExportsReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({
        exportedConstNames: [],
        typeExports: [
          { typeName: 'MockHandle', isSchemaInferred: false, isExempt: true },
          { typeName: 'RecordedCalls', isSchemaInferred: false, isExempt: true },
        ],
      });
    });

    it('VALID: {same-file z.infer alias, function alias, data alias} => exempts the intersections and the function carrier only', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/thing-contract.ts',
        [
          'export const thingContract = z.object({ id: z.string() });',
          'type ThingData = z.infer<typeof thingContract>;',
          'type Send = () => void;',
          'type Plain = { id: string };',
          'export type Thing = ThingData & { send: Send };',
          'export type Carrier = { handler: Send };',
          'export type Wrapped = ThingData;',
          'export type Loose = { id: Plain };',
          'export type Extra = ThingData & Plain;',
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractFileExportsReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({
        exportedConstNames: ['thingContract'],
        typeExports: [
          { typeName: 'Thing', isSchemaInferred: false, isExempt: true },
          { typeName: 'Carrier', isSchemaInferred: false, isExempt: true },
          { typeName: 'Wrapped', isSchemaInferred: true, isExempt: false },
          { typeName: 'Loose', isSchemaInferred: false, isExempt: false },
          { typeName: 'Extra', isSchemaInferred: false, isExempt: false },
        ],
      });
    });

    it('VALID: {unique symbol phantom interface, Record of it, interface with data beside the key} => exempts the first two only', () => {
      const sourceFile = ts.createSourceFile(
        '/repo/ingredient-contract.ts',
        [
          'declare const ING: unique symbol;',
          'export interface AnyIngredient { readonly [ING]: unknown }',
          'export type Registry = Record<string, AnyIngredient>;',
          'export interface Mixed { readonly [ING]: unknown; id: string }',
          'export type MixedRegistry = Record<string, Mixed>;',
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = contractFileExportsReadLayerTransformer({ sourceFile });

      expect(result).toStrictEqual({
        exportedConstNames: [],
        typeExports: [
          { typeName: 'AnyIngredient', isSchemaInferred: false, isExempt: true },
          { typeName: 'Registry', isSchemaInferred: false, isExempt: true },
          { typeName: 'Mixed', isSchemaInferred: false, isExempt: false },
          { typeName: 'MixedRegistry', isSchemaInferred: false, isExempt: false },
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
