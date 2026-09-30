/**
 * PURPOSE: The arguments a session's `withNestedChain` extra takes — how many sub-agent levels deep
 * to recurse. Reach for this over `@dungeonmaster/eslint-plugin`'s `depthCountContract`: that brand
 * measures a FOLDER's nesting under `src/[folder-type]/`, a package this one does not depend on, and
 * a coincidentally-named brand from an unrelated domain is exactly the drift the no-restating rule
 * warns about — so this file brands its own `depth` field instead.
 *
 * USAGE:
 * nestedChainArgsContract.parse({ depth: 2 });
 * // Returns NestedChainArgs
 */
import { z } from '#gateway/npm/zod';

export const nestedChainArgsContract = z
  .object({
    depth: z.number().int().positive().brand<'NestedChainArgsDepth'>(),
  })
  .brand<'NestedChainArgs'>();

export type NestedChainArgs = z.infer<typeof nestedChainArgsContract>;
