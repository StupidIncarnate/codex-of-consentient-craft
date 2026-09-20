/**
 * PURPOSE: Required architectural files for @dungeonmaster/hydration-recipes package
 *
 * USAGE:
 * import { hydrationRecipesStructureStatics } from './statics/hydration-recipes-structure/hydration-recipes-structure-statics';
 * const files = hydrationRecipesStructureStatics.requiredFiles;
 */
export const hydrationRecipesStructureStatics = {
  requiredFiles: [
    'src/startup/start-hydration-recipes.ts',
    'src/flows/recipes/recipes-flow.ts',
    'responders.ts',
    'src/responders/recipes/listing/recipes-listing-responder.ts',
    'src/responders/recipes/seed/recipes-seed-responder.ts',
  ],
} as const;
