/**
 * PURPOSE: Public entry point for this package's brokers surface — the EXECUTABLE half of the
 * recipe book. `@dungeonmaster/siegelense`'s `seed` step and `start --seed` both reach a recipe
 * through `recipeRunBroker` and nothing else, so which name runs which code is decided here, in
 * the package that owns the recipes.
 *
 * USAGE:
 * import { recipeRunBroker } from '@dungeonmaster/siegelense-recipes/brokers';
 */

export * from './src/brokers/recipe/run/recipe-run-broker';
