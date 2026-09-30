/**
 * PURPOSE: Validates the `compilerOptions` entries `dungeonmaster init` sets in a consumer's
 * tsconfig — each option name mapping to a string (`"node16"`) or a string list
 * (`["gateway-dist", "source"]`), the only value shapes the gateway resolution settings take.
 *
 * USAGE:
 * const options = tsconfigCompilerOptionsContract.parse({ module: 'node16', customConditions: ['source'] });
 * // Returns validated TsconfigCompilerOptions with branded keys and values
 */

import { z } from '#gateway/npm/zod';

export const tsconfigCompilerOptionsContract = z.record(
  z.string(),
  z.union([
    z.string().brand<'TsconfigCompilerOptionsValue'>(),
    z.array(z.string().brand<'TsconfigCompilerOptionsValue'>()),
  ]),
);

export type TsconfigCompilerOptions = z.infer<typeof tsconfigCompilerOptionsContract>;
