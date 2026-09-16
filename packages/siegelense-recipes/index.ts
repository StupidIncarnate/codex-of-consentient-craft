/**
 * PURPOSE: The manifest `@dungeonmaster/siegelense` reads to list this repo's recipes without
 * importing them. Chunk 8's listing responder globs `packages/siegelense-recipes/dist/index.js`,
 * dynamically imports it, and reads `recipesManifest` off it — every recipe's `name`,
 * `description` and `inputs`, as static data. `recipeManifestContract` is where a duplicate
 * recipe `name` is caught, mirroring what `registryCreateBroker` does for ingredient names.
 *
 * Reading `recipes {}` needs a BUILD first: this file's compiled output is what chunk 8 imports,
 * so `npm run build --workspace=@dungeonmaster/siegelense-recipes` must run before the listing is
 * honest about a just-edited recipe.
 *
 * No test is colocated with this file: ward's own test discovery is scoped to `src/` and `test/`,
 * so a `.test.ts` sitting beside a root barrel is invisible to it (measured directly — `--only
 * unit` against a root-level test file reports `skip`, not a pass). Each entry's `recipeName`,
 * `description` and `inputs` are instead asserted in that recipe's OWN colocated
 * `.integration.test.ts`, under a "the manifest identity chunk 8 reads off this same export"
 * block — the exact values this array carries, since `recipeManifestContract.parse` only
 * re-validates the shape and changes nothing.
 *
 * USAGE:
 * import { recipesManifest } from '@dungeonmaster/siegelense-recipes';
 * // Returns [{ recipeName: 'guild-mid-execution', description: '…' }, …]
 */
import { recipeManifestContract } from '@dungeonmaster/hydration/contracts';

import { guildMidExecutionRecipeBroker } from './src/brokers/guild-mid-execution/recipe/guild-mid-execution-recipe-broker';
import { questAdvancesOneStepRecipeBroker } from './src/brokers/quest-advances-one-step/recipe/quest-advances-one-step-recipe-broker';
import { sessionWithNestedChainRecipeBroker } from './src/brokers/session-with-nested-chain/recipe/session-with-nested-chain-recipe-broker';

export const recipesManifest = recipeManifestContract.parse([
  guildMidExecutionRecipeBroker,
  questAdvancesOneStepRecipeBroker,
  sessionWithNestedChainRecipeBroker,
]);
