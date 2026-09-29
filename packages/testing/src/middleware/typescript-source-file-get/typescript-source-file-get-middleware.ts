/**
 * PURPOSE: Finds the parsed source file for one path the proxy-mock hoister walks: the ts-jest
 * program's own copy when it holds the file, otherwise a fresh parse of the file read off disk (a
 * cross-package proxy, or any run where ts-jest built no program). An unreadable file answers
 * undefined, so a walk skips it rather than failing the transform.
 *
 * USAGE:
 * const sourceFile = typescriptSourceFileGetMiddleware({ program, filePath });
 * // Returns ts.SourceFile, or undefined when neither the program nor the disk has it
 */

import * as ts from '#gateway/npm/typescript';
import { readFileSync } from '#gateway/node/fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const typescriptSourceFileGetMiddleware = ({
  program,
  filePath,
}: {
  program: ts.Program | undefined;
  filePath: FilePath;
}): ts.SourceFile | undefined => {
  // There may be NO program: ts-jest builds one only when `isolatedModules` is off, and on its
  // transpile path `this.program` is never assigned before the transformer factory reads it.
  // Reaching through an absent program would throw inside the transform, surfacing as a compile
  // failure naming this file rather than the config that caused it.
  const fromProgram = program?.getSourceFile(filePath);
  if (fromProgram) {
    return fromProgram;
  }

  try {
    const content = readFileSync(filePath);
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  } catch {
    return undefined;
  }
};
