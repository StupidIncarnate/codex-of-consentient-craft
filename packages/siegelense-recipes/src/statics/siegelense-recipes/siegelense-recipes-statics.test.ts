import { siegelenseRecipesStatics } from './siegelense-recipes-statics';

describe('siegelenseRecipesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(siegelenseRecipesStatics).toStrictEqual({
      packageName: 'siegelense-recipes',
    });
  });
});
