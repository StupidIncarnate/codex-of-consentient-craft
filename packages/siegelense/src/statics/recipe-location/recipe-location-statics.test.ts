import { recipeLocationStatics } from './recipe-location-statics';

describe('recipeLocationStatics', () => {
  describe('packageDir', () => {
    it('VALID: {packageDir} => names packages/siegelense-recipes as both segments and one relative path', () => {
      expect(recipeLocationStatics.packageDir).toStrictEqual({
        segments: ['packages', 'siegelense-recipes'],
        relative: 'packages/siegelense-recipes',
      });
    });

    it('VALID: {packageDir.segments joined} => is the same path as packageDir.relative', () => {
      expect(recipeLocationStatics.packageDir.segments.join('/')).toBe(
        recipeLocationStatics.packageDir.relative,
      );
    });
  });
});
