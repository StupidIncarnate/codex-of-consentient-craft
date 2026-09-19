/**
 * PURPOSE: The arguments a session's `withNestedChain` extra takes — how many sub-agent levels deep
 * to recurse. Reach for this over `@dungeonmaster/eslint-plugin`'s `depthCountContract`: that brand
 * measures a FOLDER's nesting under `src/[folder-type]/`, a package this one does not depend on, and
 * a coincidentally-named brand from an unrelated domain is exactly the drift the no-restating rule
 * warns about — so this file mints its own `ChainDepth` instead.
 *
 * USAGE:
 * nestedChainArgsContract.parse({ depth: 2 });
 * // Returns NestedChainArgs
 */
import { z } from 'zod';

const chainDepthContract = z.number().int().positive().brand<'ChainDepth'>();

export type ChainDepth = z.infer<typeof chainDepthContract>;

export const nestedChainArgsContract = z.object({
  depth: chainDepthContract,
});

export type NestedChainArgs = z.infer<typeof nestedChainArgsContract>;
