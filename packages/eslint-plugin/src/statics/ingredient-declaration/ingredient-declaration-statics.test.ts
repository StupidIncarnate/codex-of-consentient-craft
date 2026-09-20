import { ingredientDeclarationStatics } from './ingredient-declaration-statics';

describe('ingredientDeclarationStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(ingredientDeclarationStatics).toStrictEqual({
      fileNameSuffixes: ['-ingredient.ts', '-ingredient.tsx'],
      brokerFileNameSuffixes: ['-ingredient-broker.ts', '-ingredient-broker.tsx'],
      recipePackageNameSuffix: '-recipes',
      declarationFunctionName: 'ingredient',
    });
  });
});
