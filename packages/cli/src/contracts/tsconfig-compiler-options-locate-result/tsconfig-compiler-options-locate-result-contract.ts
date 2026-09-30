/**
 * PURPOSE: What `tsconfigCompilerOptionsLocateTransformer` reports about a tsconfig's own
 * `compilerOptions` block — where a new option may be spliced in, and for each option already
 * there, the exact character range of its value so that value alone can be replaced. A
 * `situation` of `missingCompilerOptions` is one this install step leaves untouched.
 *
 * USAGE:
 * tsconfigCompilerOptionsLocateResultContract.parse({ situation: 'hasCompilerOptions', insertPos: 42, indent: '    ', needsLeadingComma: true, existing: [] });
 * // Returns a validated TsconfigCompilerOptionsLocateResult
 */

import { z } from '#gateway/npm/zod';

const tsconfigTextPositionContract = z.number().int().nonnegative().brand<'TsconfigTextPosition'>();

export const tsconfigCompilerOptionsLocateResultContract = z.discriminatedUnion('situation', [
  z.object({ situation: z.literal('missingCompilerOptions') }).brand<'TsconfigCompilerOptionsLocateResult'>(),
  z.object({
    situation: z.literal('hasCompilerOptions'),
    insertPos: tsconfigTextPositionContract,
    indent: z.string().brand<'TsconfigCompilerOptionsLocateResultIndent'>(),
    needsLeadingComma: z.boolean(),
    existing: z.array(
      z.object({
        key: z.string().brand<'TsconfigCompilerOptionsLocateResultExistingKey'>(),
        valueStart: tsconfigTextPositionContract,
        valueEnd: tsconfigTextPositionContract,
      }).brand<'TsconfigCompilerOptionsLocateResultExisting'>(),
    ),
  }).brand<'TsconfigCompilerOptionsLocateResult'>(),
]);

export type TsconfigCompilerOptionsLocateResult = z.infer<
  typeof tsconfigCompilerOptionsLocateResultContract
>;
