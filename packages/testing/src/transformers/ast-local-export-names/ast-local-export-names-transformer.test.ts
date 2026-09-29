import * as ts from '#gateway/npm/typescript';
import { astLocalExportNamesTransformer } from './ast-local-export-names-transformer';

describe('astLocalExportNamesTransformer', () => {
  describe('local declarations', () => {
    it('VALID: {export const declaration} => returns its name', () => {
      const code = `export const pathJoinAdapterProxy = () => ({});`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual(['pathJoinAdapterProxy']);
    });

    it('VALID: {export function declaration} => returns its name', () => {
      const code = `export function doThing() {}`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual(['doThing']);
    });

    it('VALID: {export class declaration} => returns its name', () => {
      const code = `export class SomeError extends Error {}`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual(['SomeError']);
    });

    it('VALID: {bare export list, no from clause} => returns its names', () => {
      const code = `
const a = 1;
const b = 2;
export { a, b };
`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual(['a', 'b']);
    });

    it('VALID: {multiple export const declarations in one statement} => returns every name', () => {
      const code = `export const a = 1, b = 2;`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual(['a', 'b']);
    });
  });

  describe('not local declarations', () => {
    it('EMPTY: {export * from a module} => returns empty array', () => {
      const code = `export * from './other';`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {export { name } from a module} => returns empty array', () => {
      const code = `export { adapterProxy } from './other';`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {non-exported const declaration} => returns empty array', () => {
      const code = `const internal = 1;`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {sourceFile with no statements} => returns empty array', () => {
      const code = ``;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const result = astLocalExportNamesTransformer({ sourceFile });

      expect(result).toStrictEqual([]);
    });
  });
});
