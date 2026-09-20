import { hydrationRecipesStructureStatics } from './hydration-recipes-structure-statics';

describe('hydrationRecipesStructureStatics', () => {
  it('VALID: requiredFiles => contains expected 5 architectural files', () => {
    expect(hydrationRecipesStructureStatics.requiredFiles).toStrictEqual([
      'src/startup/start-hydration-recipes.ts',
      'src/flows/recipes/recipes-flow.ts',
      'responders.ts',
      'src/responders/recipes/listing/recipes-listing-responder.ts',
      'src/responders/recipes/seed/recipes-seed-responder.ts',
    ]);
  });
});
