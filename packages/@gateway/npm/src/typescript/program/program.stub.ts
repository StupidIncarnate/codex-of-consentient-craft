/**
 * PURPOSE: A real `ts.Program` built over one in-memory source file. The compiler host serves that
 * file only and no lib files (`noLib`), so building it reads nothing from disk.
 *
 * USAGE:
 * const program = ProgramStub({ code: 'const a = 1;', fileName: 'a.ts' });
 * // Returns a real ts.Program whose getSourceFile('a.ts') has the given text
 */
import * as ts from 'typescript';

export const ProgramStub = ({
  code = 'const a = 1;',
  fileName = 'gateway-stub-sample.ts',
}: {
  code?: string;
  fileName?: string;
} = {}): ts.Program => {
  const options: ts.CompilerOptions = { noLib: true, noResolve: true, types: [] };
  const host = ts.createCompilerHost(options);
  const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);

  return ts.createProgram({
    rootNames: [fileName],
    options,
    host: {
      ...host,
      fileExists: (path) => path === fileName,
      readFile: (path) => (path === fileName ? code : undefined),
      getSourceFile: (path) => (path === fileName ? sourceFile : undefined),
    },
  });
};
