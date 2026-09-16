/**
 * PURPOSE: Runs a real TypeScript program over a fixed set of repo-relative files and reduces
 * every diagnostic to a `TypeDiagnostic` — the file, the line and the error code a negative
 * type-fixture test asserts against. Reach for this over spawning `tsc` in a child process: an
 * in-process `ts.Program` skips the CLI's argv/tsconfig-discovery machinery, which is what keeps
 * a fixture-subdirectory run fast enough to colocate with the fixture it grades.
 *
 * USAGE:
 * typescriptProgramDiagnosticsAdapter({
 *   files: [repoRelativePathContract.parse('packages/hydration/test/adapter-fixtures/one-error.ts')],
 * });
 * // Returns every syntactic and semantic diagnostic in that program, as TypeDiagnostic[]
 */

import * as ts from 'typescript';
import { resolve } from 'path';
import { repoRelativePathContract, lineCountContract } from '@dungeonmaster/shared/contracts';
import type { RepoRelativePath } from '@dungeonmaster/shared/contracts';
import { typeDiagnosticContract } from '../../../contracts/type-diagnostic/type-diagnostic-contract';
import type { TypeDiagnostic } from '../../../contracts/type-diagnostic/type-diagnostic-contract';

// Ward spawns this package's jest with `cwd` set to `packages/hydration` itself, not the repo
// root, so `process.cwd()` cannot resolve a `RepoRelativePath`. This file's own position is a
// repo-structural constant instead: six directories up from
// `packages/hydration/src/adapters/typescript/program-diagnostics/` is the repo root.
const repoRoot = resolve(__dirname, '../../../../../..');

// Fixed for every caller: one blessed strictness level so no fixture can quietly pass under a
// weaker setting than the rest. Matches this package's own tsconfig strictness (strict,
// exactOptionalPropertyTypes, noUncheckedIndexedAccess), which several shape assertions in
// positive/ depend on (e.g. `Settable`'s SavedRef omission needs exactOptionalPropertyTypes).
// skipLibCheck + a single lib file keep a fixture-subdirectory program fast — see the B1 report's
// Q10 measurement for the real cost of pulling in the package's own contracts plus zod.
const compilerOptions: ts.CompilerOptions = {
  strict: true,
  exactOptionalPropertyTypes: true,
  noUncheckedIndexedAccess: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  skipLibCheck: true,
  lib: ['lib.es2022.d.ts'],
};

export const typescriptProgramDiagnosticsAdapter = ({
  files,
}: {
  files: readonly RepoRelativePath[];
}): readonly TypeDiagnostic[] => {
  const absolutePaths = files.map((file) => resolve(repoRoot, file));
  const program = ts.createProgram(absolutePaths, compilerOptions);
  const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()];

  const results: TypeDiagnostic[] = [];
  for (const diagnostic of diagnostics) {
    if (diagnostic.file === undefined || diagnostic.start === undefined) {
      continue;
    }
    const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const absoluteFileName = diagnostic.file.fileName;
    const repoRelativeFileName = absoluteFileName.startsWith(`${repoRoot}/`)
      ? absoluteFileName.slice(repoRoot.length + 1)
      : absoluteFileName;

    results.push(
      typeDiagnosticContract.parse({
        file: repoRelativePathContract.parse(repoRelativeFileName),
        line: lineCountContract.parse(line + 1),
        code: diagnostic.code,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
      }),
    );
  }
  return results;
};
