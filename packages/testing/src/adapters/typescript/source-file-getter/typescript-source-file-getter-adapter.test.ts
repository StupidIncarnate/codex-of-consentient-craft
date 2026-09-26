import * as ts from 'typescript';
import { typescriptSourceFileGetterAdapter } from './typescript-source-file-getter-adapter';
import { typescriptSourceFileGetterAdapterProxy } from './typescript-source-file-getter-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { TypescriptProgramStub } from '../../../contracts/typescript-program/typescript-program.stub';

describe('typescriptSourceFileGetterAdapter', () => {
  describe('valid source file retrieval', () => {
    it('VALID: {program with real file, filePath} => returns source file', () => {
      const proxy = typescriptSourceFileGetterAdapterProxy();
      proxy.readsRealFiles();

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
      const proxy = typescriptSourceFileGetterAdapterProxy();
      const filePath = FilePathStub({ value: '/repo/packages/other/src/cross-package.ts' });
      proxy.fileContains({ filePath, content: 'export const crossPackage = 1;' });
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): undefined => undefined,
        },
      });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect({ fileName: result?.fileName, text: result?.text }).toStrictEqual({
        fileName: filePath,
        text: 'export const crossPackage = 1;',
      });
    });

    it('INVALID: {program, nonexistent filePath} => returns undefined', () => {
      const proxy = typescriptSourceFileGetterAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent.ts' });
      proxy.fileMissing({ filePath });
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): undefined => undefined,
        },
      });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect(result).toBe(undefined);
    });
  });
});
