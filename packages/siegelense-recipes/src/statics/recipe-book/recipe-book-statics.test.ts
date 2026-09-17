import { recipeBookStatics } from './recipe-book-statics';

describe('recipeBookStatics', () => {
  describe('recipes', () => {
    it("VALID: {recipeBookStatics.recipes} => declares both named recipes whole, with the spec's own produces: text and fidelity", () => {
      expect(recipeBookStatics.recipes).toStrictEqual([
        {
          name: 'guild-with-three-quests',
          produces: 'one guild holding three quests, one in_progress',
          fidelity: 'production',
          mirrors: null,
          parameters: [],
          returns: [
            {
              name: 'guildId',
              description: 'the seeded guild, for a later recipe that stacks onto it',
            },
            {
              name: 'guildSlug',
              description: "the guild's own route segment",
            },
            {
              name: 'questId',
              description:
                'the one quest left in_progress, the one an assertion must tell from the other two',
            },
          ],
        },
        {
          name: 'session-with-nested-subagent',
          produces:
            'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
          fidelity: 'direct',
          mirrors:
            'the Claude CLI session transcript writer — its on-disk location is claudePathSlugEncoderTransformer, its line shapes are the stream-line stubs in @dungeonmaster/shared/contracts',
          parameters: [
            {
              name: 'guild',
              description:
                "the guild the transcript is filed under — an earlier recipe's guildId, passed explicitly",
              required: true,
            },
          ],
          returns: [
            {
              name: 'sessionId',
              description: 'the session the outer chain was written as',
            },
            {
              name: 'sessions.outer',
              description: 'the route that renders the outer sub-agent chain',
            },
            {
              name: 'sessions.nested',
              description: 'the route that renders the chain nested inside it',
            },
          ],
        },
      ]);
    });

    it('VALID: {every entry} => carries a distinct name, so a seed step resolves one recipe and never two', () => {
      const names = recipeBookStatics.recipes.map((recipe) => recipe.name);

      expect(names).toStrictEqual([...new Set(names)]);
    });
  });
});
