/**
 * PURPOSE: One TypeScript diagnostic, reduced to what a negative type-fixture assertion needs —
 * the fixture path, the line and the error code. Reach for this over the compiler's own
 * `ts.Diagnostic`: that carries a `SourceFile` and cannot be compared with `toStrictEqual`.
 *
 * USAGE:
 * typeDiagnosticContract.parse({
 *   file: repoRelativePathContract.parse('packages/hydration/test/type-fixtures/call-site/out-of-bounds.ts'),
 *   line: lineCountContract.parse(12),
 *   code: 2345,
 *   message: "Argument of type '3' is not assignable to parameter of type '0 | 1 | 2'.",
 * });
 * // Returns a branded TypeDiagnostic
 */

import { z } from 'zod';
import { repoRelativePathContract, lineCountContract } from '@dungeonmaster/shared/contracts';

export const typeDiagnosticContract = z.object({
  file: repoRelativePathContract,
  line: lineCountContract,
  code: z.number().int().positive().brand<'TypeScriptErrorCode'>(),
  message: z.string().min(1).brand<'DiagnosticMessage'>(),
});

export type TypeDiagnostic = z.infer<typeof typeDiagnosticContract>;
