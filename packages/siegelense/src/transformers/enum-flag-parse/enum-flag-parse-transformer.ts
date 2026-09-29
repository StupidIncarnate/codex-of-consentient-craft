/**
 * PURPOSE: Turns an enum flag's raw string into the value its branded `z.enum(...).brand<...>()`
 * contract accepts, and on a refusal answers under the flag's own name with the full accepted list
 * and the exact text the caller typed — never the contract's own message, which reads e.g. "Invalid
 * enum value. Expected 'video' | 'shot' | 'transcript' | 'log', received 'nope'" and forces the
 * reader to work out which flag it was even about. Reach for this at any site parsing a flag value
 * through a branded enum contract, in place of `flagContractParseTransformer` alone: that file only
 * reformats a contract's OWN issue text under the flag's name, and Zod's own "Invalid enum value"
 * wording survives inside it. `options` takes the contract's own `.options` — never a
 * hand-typed copy — so the accepted list can never drift from what the contract actually accepts.
 *
 * USAGE:
 * enumFlagParseTransformer({
 *   flag: '--kind',
 *   raw: rawKind,
 *   options: pruneAssetKindContract.options,
 *   parse: (value) => pruneAssetKindContract.parse(value),
 * });
 * // Throws Error('--kind must be one of video, shot, transcript, log; got "nope"') when raw is 'nope'
 */

import { z } from '#gateway/npm/zod';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const enumFlagParseTransformer = <T>({
  flag,
  raw,
  options,
  parse,
}: {
  flag: string;
  raw: ContentText;
  options: readonly string[];
  parse: (value: ContentText) => T;
}): T => {
  try {
    return parse(raw);
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      throw error;
    }

    throw new Error(`${flag} must be one of ${options.join(', ')}; got "${raw}"`, { cause: error });
  }
};
