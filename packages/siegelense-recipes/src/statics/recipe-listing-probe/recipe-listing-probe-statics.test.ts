import { recipeListingProbeStatics } from './recipe-listing-probe-statics';

describe('recipeListingProbeStatics', () => {
  describe('the complete object', () => {
    it('VALID: {} => holds one probe per input-taking recipe, by name', () => {
      expect(recipeListingProbeStatics).toStrictEqual({
        questAdvancesOneStep: {
          guildId: '00000000-0000-4000-8000-000000000000',
        },
        sessionWithNestedChain: {
          guildPath: '/siegelense-recipes/listing-probe/never-seeded',
        },
      });
    });
  });
});
