import * as ts from 'typescript';
import { typescriptSourceFileGetterAdapter } from './typescript-source-file-getter-adapter';
import { typescriptSourceFileGetterAdapterProxy } from './typescript-source-file-getter-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { TypescriptProgramStub } from '../../../contracts/typescript-program/typescript-program.stub';

describe('typescriptSourceFileGetterAdapter', () => {
  describe('valid source file retrieval', () => {
    it('VALID: {program with real file, filePath} => returns source file', () => {
      typescriptSourceFileGetterAdapterProxy();

      // Use this actual test file as input - it's a real .ts file
      const filePath = FilePathStub({ value: __filename });

      const tsProgram = ts.createProgram([filePath], {
        skipLibCheck: true,
        noEmit: true,
      });
      const program = TypescriptProgramStub({ value: tsProgram });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect(result).toBeDefined();
      expect(result?.fileName).toBe(filePath);
    });
  });

  describe('file not in program', () => {
    it('FALLBACK: {program without file, file exists on disk} => parses directly', () => {
      typescriptSourceFileGetterAdapterProxy();

      // Create an empty program that doesn't include any files
      const tsProgram = ts.createProgram({
        rootNames: [],
        options: {},
      });
      const program = TypescriptProgramStub({ value: tsProgram });

      // Use this actual test file which exists on disk but is not in the program
      const filePath = FilePathStub({ value: __filename });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      // Should parse the file directly since it exists on disk
      expect(result).toBeDefined();
      expect(result?.fileName).toBe(filePath);
    });

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
