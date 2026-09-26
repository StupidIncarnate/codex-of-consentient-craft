/**
 * PURPOSE: What `typescriptTsconfigPathsLocateAdapter` reports about a tsconfig's own
 * `compilerOptions.paths` — where a caller may splice in new entries, and (when `paths` already
 * exists) which keys are already there. A `situation` of `missingCompilerOptions` is the one this
 * install step never tries to write into; every real tsconfig it touches already has the block.
 *
 * USAGE:
 * tsconfigPathsLocateResultContract.parse({ situation: 'missingPaths', insertPos: 42, indent: '    ', needsLeadingComma: true });
 * // Returns a validated TsconfigPathsLocateResult
 */

import { z } from 'zod';

const tsconfigInsertPositionContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'TsconfigInsertPosition'>();
const tsconfigIndentContract = z.string().brand<'TsconfigIndent'>();
const tsconfigPathsExistingKeyContract = z.string().brand<'TsconfigPathsExistingKey'>();

export const tsconfigPathsLocateResultContract = z.discriminatedUnion('situation', [
  z.object({ situation: z.literal('missingCompilerOptions') }),
  z.object({
    situation: z.literal('missingPaths'),
    insertPos: tsconfigInsertPositionContract,
    indent: tsconfigIndentContract,
    needsLeadingComma: z.boolean(),
  }),
  z.object({
    situation: z.literal('hasPaths'),
    insertPos: tsconfigInsertPositionContract,
    indent: tsconfigIndentContract,
    needsLeadingComma: z.boolean(),
    existingKeys: z.array(tsconfigPathsExistingKeyContract),
  }),
]);

export type TsconfigPathsLocateResult = z.infer<typeof tsconfigPathsLocateResultContract>;
