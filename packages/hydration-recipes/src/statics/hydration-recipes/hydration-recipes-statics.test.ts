import { hydrationRecipesStatics } from './hydration-recipes-statics';

describe('hydrationRecipesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(hydrationRecipesStatics).toStrictEqual({
      packageName: 'hydration-recipes',
    });
  });
});
