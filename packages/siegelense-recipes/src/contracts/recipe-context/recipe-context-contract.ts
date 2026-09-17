/**
 * PURPOSE: Everything a recipe is handed, and deliberately nothing else — the lane's API origin and
 * its throwaway home. Reach for this over passing the `LaneSession` itself: a lane carries a live
 * `BrowserSession`, and "a recipe touches STATE, never a screen" (siegelense-recipes.md line 471)
 * has to be held by a shape rather than by a comment. There is no field here a DOM handle could live
 * in — no page, no ref, no selector, no rect — so a recipe that wanted one would have to grow a field
 * on this contract, which is a review rather than a typo.
 *
 * `apiBaseUrl` is the API process's own origin, never the web one: the api process is what binds
 * `/api/*`, and routing a recipe through Vite's proxy would add a hop that proves nothing.
 * `homePath` is the lane's throwaway home — `DUNGEONMASTER_HOME` *and* `HOME` for that api process
 * (`laneSpecStatics`), so it is also what `os.homedir()` resolves to inside the server and therefore
 * where a Claude session transcript has to land for the app to find it.
 *
 * USAGE:
 * recipeContextContract.parse({
 *   apiBaseUrl: 'http://dungeonmaster.localhost:34172',
 *   homePath: '/tmp/dm-siege-inst_7f3a9c21',
 * });
 * // Returns a validated RecipeContext
 */

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const recipeContextContract = z
  .object({
    apiBaseUrl: contentTextContract,
    homePath: absoluteFilePathContract,
  })
  .strict();

export type RecipeContext = z.infer<typeof recipeContextContract>;
