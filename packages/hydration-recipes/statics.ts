/**
 * PURPOSE: Public entry point for this package's statics surface — every downstream import
 * of '@dungeonmaster/hydration-recipes/statics' resolves through this file. `recipeBookStatics`
 * is the one every caller comes for: the declaration `dungeonmaster siegelense recipes` lists and
 * a `seed` step resolves against.
 *
 * USAGE:
 * import { recipeBookStatics } from '@dungeonmaster/hydration-recipes/statics';
 */

export * from './src/statics/hydration-recipes/hydration-recipes-statics';
export * from './src/statics/recipe-fidelity/recipe-fidelity-statics';
export * from './src/statics/recipe-book/recipe-book-statics';
