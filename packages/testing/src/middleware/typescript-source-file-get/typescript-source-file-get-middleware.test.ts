import * as ts from '#gateway/npm/typescript';
import { typescriptSourceFileGetMiddleware } from './typescript-source-file-get-middleware';
import { typescriptSourceFileGetMiddlewareProxy } from './typescript-source-file-get-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { TypescriptProgramStub } from '../../contracts/typescript-program/typescript-program.stub';

describe('typescriptSourceFileGetMiddleware', () => {
  describe('file held by the program', () => {
    it('VALID: {program holds filePath} => returns the program copy, never reading disk', () => {
      const proxy = typescriptSourceFileGetMiddlewareProxy();
      const filePath = FilePathStub({ value: '/repo/packages/app/src/held.ts' });
      proxy.fileContains({ filePath, content: 'export const fromDisk = 2;' });
      const heldSourceFile = ts.createSourceFile(
        filePath,
        'export const fromProgram = 1;',
        ts.ScriptTarget.Latest,
        true,
      );
      const program = TypescriptProgramStub({
        value: { getSourceFile: (): ts.SourceFile => heldSourceFile },
      });

      const result = typescriptSourceFileGetMiddleware({ program, filePath });

      expect({ fileName: result?.fileName, text: result?.text }).toStrictEqual({
        fileName: filePath,
        text: 'export const fromProgram = 1;',
      });
    });
  });

  describe('file not in the program', () => {
    it('EDGE: {program without file, file on disk} => parses the file read off disk', () => {
      const proxy = typescriptSourceFileGetMiddlewareProxy();
      const filePath = FilePathStub({ value: '/repo/packages/other/src/cross-package.ts' });
      proxy.fileContains({ filePath, content: 'export const crossPackage = 1;' });
      const program = TypescriptProgramStub({
        value: { getSourceFile: (): undefined => undefined },
      });

      const result = typescriptSourceFileGetMiddleware({ program, filePath });

      expect({ fileName: result?.fileName, text: result?.text }).toStrictEqual({
        fileName: filePath,
        text: 'export const crossPackage = 1;',
      });
    });

    it('EMPTY: {no program at all, file on disk} => parses the file read off disk', () => {
      const proxy = typescriptSourceFileGetMiddlewareProxy();
      const filePath = FilePathStub({ value: '/repo/packages/other/src/transpile-only.ts' });
      proxy.fileContains({ filePath, content: 'export const transpileOnly = 1;' });
      const program = TypescriptProgramStub({ value: undefined });

      const result = typescriptSourceFileGetMiddleware({ program, filePath });

      expect({ fileName: result?.fileName, text: result?.text }).toStrictEqual({
        fileName: filePath,
        text: 'export const transpileOnly = 1;',
      });
    });

    it('INVALID: {program without file, file missing} => returns undefined', () => {
      const proxy = typescriptSourceFileGetMiddlewareProxy();
      const filePath = FilePathStub({ value: '/nonexistent.ts' });
      proxy.fileMissing({ filePath });
      const program = TypescriptProgramStub({
        value: { getSourceFile: (): undefined => undefined },
      });

      const result = typescriptSourceFileGetMiddleware({ program, filePath });

      expect(result).toBe(undefined);
    });
  });
});
