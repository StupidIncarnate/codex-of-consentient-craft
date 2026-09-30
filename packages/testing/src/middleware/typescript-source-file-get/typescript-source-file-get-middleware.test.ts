import { typescriptSourceFileGetMiddleware } from './typescript-source-file-get-middleware';
import { typescriptSourceFileGetMiddlewareProxy } from './typescript-source-file-get-middleware.proxy';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

describe('typescriptSourceFileGetMiddleware', () => {
  describe('file held by the program', () => {
    it('VALID: {program holds filePath} => returns the program copy, never reading disk', () => {
      const proxy = typescriptSourceFileGetMiddlewareProxy();
      const filePath = '/repo/packages/app/src/held.ts';
      proxy.fileContains({ filePath, content: 'export const fromDisk = 2;' });
      const program = ProgramStub({ code: 'export const fromProgram = 1;', fileName: filePath });

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
      const filePath = '/repo/packages/other/src/cross-package.ts';
      proxy.fileContains({ filePath, content: 'export const crossPackage = 1;' });
      const program = ProgramStub({
        code: 'export const other = 1;',
        fileName: '/repo/held-elsewhere.ts',
      });

      const result = typescriptSourceFileGetMiddleware({ program, filePath });

      expect({ fileName: result?.fileName, text: result?.text }).toStrictEqual({
        fileName: filePath,
        text: 'export const crossPackage = 1;',
      });
    });

    it('EMPTY: {no program at all, file on disk} => parses the file read off disk', () => {
      const proxy = typescriptSourceFileGetMiddlewareProxy();
      const filePath = '/repo/packages/other/src/transpile-only.ts';
      proxy.fileContains({ filePath, content: 'export const transpileOnly = 1;' });
      const program = undefined;

      const result = typescriptSourceFileGetMiddleware({ program, filePath });

      expect({ fileName: result?.fileName, text: result?.text }).toStrictEqual({
        fileName: filePath,
        text: 'export const transpileOnly = 1;',
      });
    });

    it('INVALID: {program without file, file missing} => returns undefined', () => {
      const proxy = typescriptSourceFileGetMiddlewareProxy();
      const filePath = '/nonexistent.ts';
      proxy.fileMissing({ filePath });
      const program = ProgramStub({
        code: 'export const other = 1;',
        fileName: '/repo/held-elsewhere.ts',
      });

      const result = typescriptSourceFileGetMiddleware({ program, filePath });

      expect(result).toBe(undefined);
    });
  });
});
