/**
 * PURPOSE: Public entry point for this package's statics surface — every downstream import
 * of '@dungeonmaster/hydration-recipes/statics' resolves through this file. The declaration
 * `dungeonmaster siegelense recipes` lists and a `seed` step resolves against lives in each
 * recipe's own broker under `brokers/recipes/<name>/`, wired into `recipesCatalogBroker` — never
 * here. `recipeFidelityStatics` is what a marker on one of those recipes MEANS, not the recipes
 * themselves.
 *
 * USAGE:
 * import { recipeFidelityStatics } from '@dungeonmaster/hydration-recipes/statics';
 */

export * from './src/statics/hydration-recipes/hydration-recipes-statics';
export * from './src/statics/recipe-fidelity/recipe-fidelity-statics';
