/**
 * PURPOSE: The manifest and listing broker `@dungeonmaster/siegelense` reads to list this repo's
 * recipes without importing them. Chunk 8's listing responder globs
 * `packages/hydration-recipes/dist/index.js`, dynamically imports it, and reads the export names
 * `recipesConventionStatics` (`@dungeonmaster/shared/statics`) declares off it. `export *`, never
 * an alias, for each: the two packages may not import each other, so a renamed export here compiles
 * fine on both sides and fails only at run time, in a consumer's repo —
 * `src/hydration-recipes-exports.integration.test.ts` is what catches that instead.
 * `recipesConventionStatics.exports.seedRun` names a third export this file does not yet carry —
 * the seed-running broker has no implementation in this package yet.
 *
 * `recipeManifestContract` is `z.object`-backed, and `typeof` a `recipe()` callable is `'function'`
 * regardless of the `recipeName`/`description`/`inputs` properties `Object.assign` put on it — zod
 * refuses a function as an object input outright, so each callable is projected down to its own
 * identity fields before the manifest ever sees it.
 *
 * Reading `recipes {}` needs a BUILD first: this file's compiled output is what chunk 8 imports,
 * so `npm run build --workspace=@dungeonmaster/hydration-recipes` must run before the listing is
 * honest about a just-edited recipe. The same is true of `recipesSeedRunBroker`: a `seed` step
 * dynamically imports this same compiled output.
 *
 * No test is colocated with this file: ward's own test discovery is scoped to `src/` and `test/`,
 * so a `.test.ts` sitting beside a root barrel is invisible to it (measured directly — `--only
 * unit` against a root-level test file reports `skip`, not a pass). Each entry's `recipeName`,
 * `description` and `inputs` are instead asserted in that recipe's OWN colocated
 * `.integration.test.ts`, under a "the manifest identity chunk 8 reads off this same export"
 * block — the exact values this array carries.
 *
 * USAGE:
 * import {
 *   recipesManifest,
 *   recipesListingBuildBroker,
 *   recipesSeedRunBroker,
 * } from '@dungeonmaster/hydration-recipes';
 * // recipesManifest returns [{ recipeName: 'guild-mid-execution', description: '…' }, …]
 * // recipesListingBuildBroker() returns the recipes {} listing: recipeName, description,
 * // inputKeys, runs, makes
 * // recipesSeedRunBroker({ recipeName, home }) runs that recipe's plan and returns the saved records
 */
import { recipeManifestContract } from '@dungeonmaster/hydration/contracts';

import { guildMidExecutionRecipeBroker } from './src/brokers/guild-mid-execution/recipe/guild-mid-execution-recipe-broker';
import { questAdvancesOneStepRecipeBroker } from './src/brokers/quest-advances-one-step/recipe/quest-advances-one-step-recipe-broker';
import { sessionWithNestedChainRecipeBroker } from './src/brokers/session-with-nested-chain/recipe/session-with-nested-chain-recipe-broker';

export const recipesManifest = recipeManifestContract.parse(
  [
    guildMidExecutionRecipeBroker,
    questAdvancesOneStepRecipeBroker,
    sessionWithNestedChainRecipeBroker,
  ].map(({ recipeName, description, inputs }) => ({
    recipeName,
    description,
    ...(inputs === undefined ? {} : { inputs }),
  })),
);

export * from './src/brokers/recipes-listing/build/recipes-listing-build-broker';

export * from './src/brokers/recipes-seed/run/recipes-seed-run-broker';
