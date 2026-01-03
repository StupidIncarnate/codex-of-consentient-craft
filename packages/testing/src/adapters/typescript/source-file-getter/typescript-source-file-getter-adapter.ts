/**
 * PURPOSE: Gets a TypeScript source file from a program by file path
 *
 * USAGE:
 * const sourceFile = typescriptSourceFileGetterAdapter({program, filePath});
 * // Returns TypeScript SourceFile or undefined if not found
 *
 * Falls back to parsing file directly if not in program (e.g., cross-package files)
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { TypescriptProgram } from '../../../contracts/typescript-program/typescript-program-contract';
import type { TypescriptSourceFile } from '../../../contracts/typescript-source-file/typescript-source-file-contract';

export const typescriptSourceFileGetterAdapter = ({
  program,
  filePath,
}: {
  program: TypescriptProgram;
  filePath: FilePath;
}): TypescriptSourceFile | undefined => {
  // Try to get from program first
  const fromProgram = (program as unknown as ts.Program).getSourceFile(filePath);
  if (fromProgram) {
    return fromProgram as unknown as TypescriptSourceFile;
  }

  // Fall back to parsing file directly (for cross-package files)
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    return parsed as unknown as TypescriptSourceFile;
  } catch {
    return undefined;
  }
};
