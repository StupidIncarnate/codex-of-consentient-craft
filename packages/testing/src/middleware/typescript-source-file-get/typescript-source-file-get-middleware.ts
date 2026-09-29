/**
 * PURPOSE: Finds the parsed source file for one path the proxy-mock hoister walks: the ts-jest
 * program's own copy when it holds the file, otherwise a fresh parse of the file read off disk (a
 * cross-package proxy, or any run where ts-jest built no program). An unreadable file answers
 * undefined, so a walk skips it rather than failing the transform.
 *
 * USAGE:
 * const sourceFile = typescriptSourceFileGetMiddleware({ program, filePath });
 * // Returns TypescriptSourceFile, or undefined when neither the program nor the disk has it
 */

import * as ts from '#gateway/npm/typescript';
import { readFileSync } from '#gateway/node/fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { TypescriptProgram } from '../../contracts/typescript-program/typescript-program-contract';
import type { TypescriptSourceFile } from '../../contracts/typescript-source-file/typescript-source-file-contract';

export const typescriptSourceFileGetMiddleware = ({
  program,
  filePath,
}: {
  program: TypescriptProgram;
  filePath: FilePath;
}): TypescriptSourceFile | undefined => {
  // There may be NO program: ts-jest builds one only when `isolatedModules` is off, and on its
  // transpile path `this.program` is never assigned before the transformer factory reads it.
  // Reaching through an absent program would throw inside the transform, surfacing as a compile
  // failure naming this file rather than the config that caused it.
  const fromProgram = (program as unknown as ts.Program | undefined)?.getSourceFile(filePath);
  if (fromProgram) {
    return fromProgram as unknown as TypescriptSourceFile;
  }

  try {
    const content = readFileSync(filePath);
    const parsed = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    return parsed as unknown as TypescriptSourceFile;
  } catch {
    return undefined;
  }
};
