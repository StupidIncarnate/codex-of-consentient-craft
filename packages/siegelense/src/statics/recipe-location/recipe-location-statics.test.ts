import { recipeLocationStatics } from './recipe-location-statics';

describe('recipeLocationStatics', () => {
  describe('packageDir', () => {
    it('VALID: {packageDir} => names packages/hydration-recipes as both segments and one relative path', () => {
      expect(recipeLocationStatics.packageDir).toStrictEqual({
        segments: ['packages', 'hydration-recipes'],
        relative: 'packages/hydration-recipes',
      });
    });

    it('VALID: {packageDir.segments joined} => is the same path as packageDir.relative', () => {
      expect(recipeLocationStatics.packageDir.segments.join('/')).toBe(
        recipeLocationStatics.packageDir.relative,
      );
    });
  });
});
