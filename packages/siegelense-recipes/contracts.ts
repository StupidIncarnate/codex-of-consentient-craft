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

export * from './src/contracts/recipe-return-name/recipe-return-name-contract';
export * from './src/contracts/recipe-return-name/recipe-return-name.stub';

export * from './src/contracts/recipe-manifest/recipe-manifest-contract';
export * from './src/contracts/recipe-manifest/recipe-manifest.stub';

export * from './src/contracts/recipe-context/recipe-context-contract';
export * from './src/contracts/recipe-context/recipe-context.stub';

export * from './src/contracts/recipe-result/recipe-result-contract';
export * from './src/contracts/recipe-result/recipe-result.stub';

export * from './src/contracts/guild-listing/guild-listing-contract';
export * from './src/contracts/guild-listing/guild-listing.stub';

export * from './src/contracts/transcript-line/transcript-line-contract';
export * from './src/contracts/transcript-line/transcript-line.stub';
