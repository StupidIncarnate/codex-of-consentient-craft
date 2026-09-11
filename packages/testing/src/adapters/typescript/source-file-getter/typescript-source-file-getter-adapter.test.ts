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

      // The adapter reads `program.getSourceFile(filePath)` and nothing else, so what this proves
      // is that a REAL program over a real file on disk answers that lookup — no ambient
      // declaration takes any part in it. Both options exist to keep those declarations out of the
      // program: omitting `types` makes TypeScript pull in every package under node_modules/@types
      // (445 source files, 556ms), and `noLib` drops the default lib chain on top of that
      // (30 files and 95ms, against 23 files and 31ms). The root file and its own module graph are
      // what remain, which is the whole fixture.
      const tsProgram = ts.createProgram([filePath], {
        skipLibCheck: true,
        noEmit: true,
        types: [],
        noLib: true,
      });
      const program = TypescriptProgramStub({ value: tsProgram });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect(result?.fileName).toBe(filePath);
    });
  });

  describe('file not in program', () => {
    it('EDGE: {program without file, file exists on disk} => parses directly', () => {
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

      expect(result).toBe(undefined);
    });
  });
});
