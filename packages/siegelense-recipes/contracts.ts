/**
 * PURPOSE: Public entry point for this package's contracts surface — every downstream import
 * of '@dungeonmaster/siegelense-recipes/contracts' resolves through this file. The recipe data
 * model lives HERE, in the package that owns the recipes, so the dependency runs one way —
 * `@dungeonmaster/siegelense` reads it and nothing here reads back.
 *
 * USAGE:
 * import { recipeManifestContract } from '@dungeonmaster/siegelense-recipes/contracts';
 */

export * from './src/contracts/recipe-fidelity/recipe-fidelity-contract';
export * from './src/contracts/recipe-fidelity/recipe-fidelity.stub';

export * from './src/contracts/recipe-name/recipe-name-contract';
export * from './src/contracts/recipe-name/recipe-name.stub';

export * from './src/contracts/recipe-manifest/recipe-manifest-contract';
export * from './src/contracts/recipe-manifest/recipe-manifest.stub';
