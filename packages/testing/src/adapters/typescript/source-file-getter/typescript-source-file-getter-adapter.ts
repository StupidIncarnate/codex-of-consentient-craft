/**
 * PURPOSE: Gets a TypeScript source file from a program by file path
 *
 * USAGE:
 * const sourceFile = typescriptSourceFileGetterAdapter({program, filePath});
 * // Returns TypeScript SourceFile or undefined if not found
 */

import type * as ts from 'typescript';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { TypescriptProgram } from '../../../contracts/typescript-program/typescript-program-contract';
import type { TypescriptSourceFile } from '../../../contracts/typescript-source-file/typescript-source-file-contract';

export const typescriptSourceFileGetterAdapter = ({
  program,
  filePath,
}: {
  program: TypescriptProgram;
  filePath: FilePath;
}): TypescriptSourceFile | undefined =>
  (program as unknown as ts.Program).getSourceFile(filePath) as unknown as
    | TypescriptSourceFile
    | undefined;
