import * as ts from 'typescript';
import { typescriptSourceFileGetterAdapter } from './typescript-source-file-getter-adapter';
import { typescriptSourceFileGetterAdapterProxy } from './typescript-source-file-getter-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { TypescriptProgramStub } from '../../../contracts/typescript-program/typescript-program.stub';

describe('typescriptSourceFileGetterAdapter', () => {
  describe('valid source file retrieval', () => {
    it('VALID: {program with file, filePath} => returns source file', () => {
      typescriptSourceFileGetterAdapterProxy();

      const code = 'const x = 1;';
      const filePath = FilePathStub({ value: '/test.ts' });
      const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);

      const tsProgram = ts.createProgram({
        rootNames: [filePath],
        options: {},
        host: {
          ...ts.createCompilerHost({}),
          getSourceFile: () => sourceFile,
        },
      });
      const program = TypescriptProgramStub({ value: tsProgram });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect(result).toBeDefined();
      expect(result?.fileName).toBe(filePath);
    });
  });

  describe('file not in program', () => {
    it('INVALID: {program, nonexistent filePath} => returns undefined', () => {
      typescriptSourceFileGetterAdapterProxy();

      const tsProgram = ts.createProgram({
        rootNames: [],
        options: {},
      });
      const program = TypescriptProgramStub({ value: tsProgram });

      const filePath = FilePathStub({ value: '/nonexistent.ts' });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect(result).toBeUndefined();
    });
  });
});
